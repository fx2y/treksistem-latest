import React from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const OrdersPage: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Orders Management</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage incoming orders
            </p>
          </div>
          <Button variant="outline">
            Export Orders
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Orders Management</CardTitle>
            <CardDescription>
              This page will allow you to view and manage orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Features coming soon:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>View all orders with filtering and search</li>
              <li>Track order status and history</li>
              <li>Manually assign drivers to orders</li>
              <li>Generate WhatsApp deep links for communication</li>
              <li>Export order data</li>
              <li>Order analytics and reporting</li>
            </ul>
            <div className="mt-6">
              <Link to="/">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OrdersPage; 