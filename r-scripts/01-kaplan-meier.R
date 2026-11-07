# Kaplan-Meier estimation ---------------------------------------------------
# NCCTG advanced lung cancer trial (survival::lung).
# Run a line with Ctrl/Cmd + Enter, or the whole file with "Source".

library(survival)

# Work on a copy so the script can be re-run safely
lung_df <- transform(survival::lung, sex = factor(sex, 1:2, c("Male", "Female")))

# Overall survival
km_all <- survfit(Surv(time, status) ~ 1, data = lung_df)
km_all

# Median survival and 1-year survival
summary(km_all, times = 365)

# By sex
km_sex <- survfit(Surv(time, status) ~ sex, data = lung_df)
plot(km_sex, col = c("#E95420", "#3465A4"), lwd = 2, mark.time = TRUE,
     xlab = "Days", ylab = "Survival probability", bty = "l")
legend("topright", levels(lung_df$sex), col = c("#E95420", "#3465A4"), lwd = 2, bty = "n")

# Log-rank test
survdiff(Surv(time, status) ~ sex, data = lung_df)
