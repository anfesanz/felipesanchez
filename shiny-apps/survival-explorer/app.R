# Survival Explorer
# Kaplan-Meier curves, log-rank test and a Cox model on survival::lung.
# Runs entirely in the browser via Shinylive (webR) — no server needed.

library(shiny)
library(survival)

lung2 <- within(survival::lung, {
  status    <- status - 1L                       # 1 = death, 0 = censored
  sex       <- factor(sex, 1:2, c("Male", "Female"))
  ecog      <- factor(ph.ecog, 0:3, c("0 (asymptomatic)", "1", "2", "3"))
  age_group <- cut(age, c(0, 60, 70, Inf), c("<60", "60-69", "70+"), right = FALSE)
  time_m    <- time / 30.44                      # days -> months
})

strata_choices <- c(
  "None"            = "1",
  "Sex"             = "sex",
  "ECOG performance" = "ecog",
  "Age group"       = "age_group"
)

palette <- c("#E95420", "#3465A4", "#4E9A06", "#77216F")

ui <- fluidPage(
  tags$head(tags$style(HTML("
    body { font-family: Ubuntu, system-ui, sans-serif; font-size: 14px; }
    h4   { color: #E95420; margin-top: 4px; }
    pre  { font-size: 12px; }
  "))),
  titlePanel("Survival Explorer — NCCTG lung cancer data"),
  sidebarLayout(
    sidebarPanel(
      width = 3,
      selectInput("strata", "Stratify by", strata_choices, selected = "sex"),
      checkboxInput("ci", "Show 95% confidence bands", TRUE),
      checkboxInput("censor", "Mark censored observations", TRUE),
      sliderInput("horizon", "Time horizon (months)", min = 6, max = 36, value = 30, step = 1),
      sliderInput("landmark", "Survival at month", min = 1, max = 30, value = 12, step = 1),
      helpText("Data: survival::lung (n = 228). Outcome: all-cause death.")
    ),
    mainPanel(
      width = 9,
      plotOutput("km", height = "360px"),
      fluidRow(
        column(6, h4("Survival at landmark"), tableOutput("landmark_tbl")),
        column(6, h4("Log-rank test"), verbatimTextOutput("logrank"))
      ),
      h4("Cox proportional hazards model"),
      verbatimTextOutput("cox")
    )
  )
)

server <- function(input, output, session) {

  formula_r <- reactive(as.formula(paste("Surv(time_m, status) ~", input$strata)))

  fit <- reactive({
    f <- survfit(formula_r(), data = lung2)
    f$call$formula <- formula_r()   # keeps print() output readable
    f
  })

  observeEvent(input$horizon, {
    updateSliderInput(session, "landmark", max = input$horizon,
                      value = min(input$landmark, input$horizon))
  })

  output$km <- renderPlot({
    f <- fit()
    n_groups <- if (is.null(f$strata)) 1 else length(f$strata)
    cols <- palette[seq_len(n_groups)]
    par(mar = c(4.5, 4.5, 1, 1), las = 1)
    plot(f, col = cols, lwd = 2, conf.int = input$ci, mark.time = input$censor,
         xlim = c(0, input$horizon), xlab = "Months since enrolment",
         ylab = "Survival probability", bty = "l")
    abline(v = input$landmark, lty = 3, col = "grey50")
    labels <- if (is.null(f$strata)) "All patients" else sub(".*=", "", names(f$strata))
    legend("topright", legend = labels, col = cols, lwd = 2, bty = "n")
  })

  output$landmark_tbl <- renderTable({
    s <- summary(fit(), times = input$landmark, extend = TRUE)
    group <- if (is.null(s$strata)) "All patients" else sub(".*=", "", as.character(s$strata))
    data.frame(
      Group      = group,
      `At risk`  = as.integer(s$n.risk),
      Survival   = sprintf("%.1f%%", 100 * s$surv),
      `95% CI`   = sprintf("%.1f–%.1f%%", 100 * s$lower, 100 * s$upper),
      check.names = FALSE
    )
  })

  output$logrank <- renderPrint({
    if (input$strata == "1") {
      cat("Choose a stratification variable to compare groups.")
    } else {
      sd <- survdiff(formula_r(), data = lung2)
      p  <- pchisq(sd$chisq, df = length(sd$n) - 1, lower.tail = FALSE)
      cat(sprintf("Chi-square = %.2f on %d df\np-value    = %s",
                  sd$chisq, length(sd$n) - 1, format.pval(p, digits = 3)))
    }
  })

  output$cox <- renderPrint({
    rhs <- if (input$strata == "1") "age + sex + ecog" else paste(unique(c(input$strata, "age", "sex")), collapse = " + ")
    rhs <- sub("age_group \\+ age", "age_group", rhs)
    m <- coxph(as.formula(paste("Surv(time_m, status) ~", rhs)), data = lung2)
    est <- summary(m)$conf.int
    out <- data.frame(HR = est[, 1], lower = est[, 3], upper = est[, 4],
                      p = summary(m)$coefficients[, "Pr(>|z|)"])
    cat("Model: Surv(time, status) ~", rhs, "\n\n")
    print(format(round(out, 3), nsmall = 3))
    cat("\nPH assumption (global Schoenfeld test) p =",
        format.pval(cox.zph(m)$table["GLOBAL", "p"], digits = 3), "\n")
  })
}

shinyApp(ui, server)
