export type Role = 
| 'unassigned'
| 'administrator'
| 'project_manager'
| 'foreman'
| 'logistician';

export const ROUTE_PERMISSIONS : Record<string, string[]>= {
    '/': ['administrator', 'project_manager', 'foreman', 'logistician'],
    '/about': ['administrator', 'project_manager', 'foreman', 'logistician'],
    '/inventory': ['administrator', 'project_manager', 'foreman'],
    '/log-delivery': ['administrator', 'foreman', 'logistician'],
    '/delivery-history': ['administrator', 'project_manager', 'foreman'],
    '/purchase-orders': ['administrator', 'project_manager'],
    '/materials-requests': ['administrator', 'foreman'],
    '/contacts': ['administrator', 'project_manager'],
}