import { z } from 'zod';

export const filterSchema = z.object({
  currencyCode: z.string().optional().describe('The currency code, e.g. USD'),
  tierMinimumUnits: z.number().optional().describe('Minimum units for the pricing tier'),
  reservationTerm: z.string().optional().describe('Reservation term, possible values: (empty), 1 Year, 3 Years, 5 Years, 1 Month'),
  retailPrice: z.number().optional().describe('Retail price'),
  unitPrice: z.number().optional().describe('Unit price'),
  armRegionName: z.string().optional().describe('Azure ARM region name'),
  location: z.string().optional().describe('Location'),
  effectiveStartDate: z.string().optional().describe('Effective start date (ISO8601)'),
  meterId: z.string().optional().describe('Meter ID'),
  meterName: z.string().optional().describe('Meter name'),
  productId: z.string().optional().describe('Product ID'),
  skuId: z.string().optional().describe('SKU ID'),
  productName: z.string().optional().describe('Product name'),
  skuName: z.string().optional().describe('SKU name'),
  serviceName: z.string().optional().describe('Service name. Possible values: Cognitive Services, Storage, Backup, Azure NetApp Files, Data Box, StorSimple, SQL Database, Azure Database for PostgreSQL, SQL Managed Instance, Azure Database for MySQL, Redis Cache, Azure Cosmos DB, Azure Managed Instance for Apache Cassandra, Azure Database for MariaDB, SQL Server Stretch Database, SQL Data Warehouse, Azure Database Migration Service, Azure Arc Enabled Databases, VPN Gateway, Bandwidth, Azure Bastion, Network Watcher, Application Gateway, Virtual WAN, Virtual Network, Azure Firewall, Azure Orbital, ExpressRoute, Azure DDOS Protection, Azure Firewall Manager, Traffic Manager, Load Balancer, Private Mobile Network, Azure Programmable Connectivity, Microsoft Azure Peering Service, NAT Gateway, Advanced Container Networking Services, Azure Route Server, Virtual Machines, Azure App Service, Cloud Services, Specialized Compute, Azure Container Apps, Functions, Azure Kubernetes Service, HPC Cache, Virtual Machines Licenses, Service Fabric Mesh, Durable Task Scheduler, Azure Local, Service Fabric'),
  serviceId: z.string().optional().describe('Service ID'),
  serviceFamily: z.string().optional().describe('Service family. Possible values: Compute, Storage, Networking, Databases, AI + Machine Learning'),
  unitOfMeasure: z.string().optional().describe('Unit of measure'),
  type: z.string().optional().describe('Type'),
  isPrimaryMeterRegion: z.boolean().optional().describe('Is primary meter region'),
  armSkuName: z.string().optional().describe('ARM SKU name')
}).refine((obj: Record<string, unknown>) => Object.keys(obj).length > 0, { message: "At least one filter must be provided" });