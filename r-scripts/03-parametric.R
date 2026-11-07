# Parametric survival models -------------------------------------------------
# Veterans' Administration lung cancer trial (survival::veteran).

library(survival)

# Weibull accelerated failure time model
wb <- survreg(Surv(time, status) ~ trt + celltype + karno, data = veteran,
              dist = "weibull")
summary(wb)

# Compare distributions by AIC
dists <- c("exponential", "weibull", "lognormal", "loglogistic")
aics  <- sapply(dists, function(d)
  AIC(survreg(Surv(time, status) ~ trt + celltype + karno, data = veteran, dist = d)))
sort(round(aics, 1))

# Kaplan-Meier vs fitted Weibull curve (overall)
km <- survfit(Surv(time, status) ~ 1, data = veteran)
wb0 <- survreg(Surv(time, status) ~ 1, data = veteran, dist = "weibull")
t <- seq(0, 1000, by = 5)
s_wb <- 1 - psurvreg(t, mean = coef(wb0), scale = wb0$scale, distribution = "weibull")
plot(km, conf.int = FALSE, lwd = 2, xlab = "Days", ylab = "Survival", bty = "l")
lines(t, s_wb, col = "#E95420", lwd = 2, lty = 2)
legend("topright", c("Kaplan-Meier", "Weibull fit"), col = c("black", "#E95420"),
       lty = c(1, 2), lwd = 2, bty = "n")
