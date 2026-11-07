# Cox proportional hazards ---------------------------------------------------

library(survival)

fit <- coxph(Surv(time, status) ~ age + sex + ph.ecog, data = lung)
summary(fit)

# Hazard ratios with 95% CI
round(exp(cbind(HR = coef(fit), confint(fit))), 3)

# Checking proportional hazards with Schoenfeld residuals
ph <- cox.zph(fit)
ph
par(mfrow = c(1, 3))
plot(ph, col = "#E95420", lwd = 2)
par(mfrow = c(1, 1))

# Adjusted survival curves for two hypothetical patients
newpat <- data.frame(age = c(60, 60), sex = c(1, 2), ph.ecog = c(1, 1))
plot(survfit(fit, newdata = newpat), col = c("#E95420", "#3465A4"), lwd = 2,
     xlab = "Days", ylab = "Predicted survival", bty = "l")
legend("topright", c("Male, 60, ECOG 1", "Female, 60, ECOG 1"),
       col = c("#E95420", "#3465A4"), lwd = 2, bty = "n")
