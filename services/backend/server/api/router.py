from ..modules import admin, auth, employees, leave, profile
from .routes import inventory, products, reports, work_logs

routers = [
    auth.router,
    employees.router,
    inventory.router,
    leave.router,
    admin.router,
    work_logs.router,
    profile.router,
    reports.router,
    products.router,
]
