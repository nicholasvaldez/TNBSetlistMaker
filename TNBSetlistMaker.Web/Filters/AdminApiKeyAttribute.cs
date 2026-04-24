using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace TNBSetlistMaker.Web.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AdminApiKeyAttribute : Attribute, IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var config = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var expectedKey = config["Admin:ApiKey"];

        if (string.IsNullOrEmpty(expectedKey))
        {
            context.Result = new StatusCodeResult(503);
            return;
        }

        var providedKey = context.HttpContext.Request.Headers["X-Admin-Key"].FirstOrDefault()
                       ?? context.HttpContext.Request.Query["key"].FirstOrDefault();

        if (!string.Equals(providedKey, expectedKey, StringComparison.Ordinal))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        await next();
    }
}
