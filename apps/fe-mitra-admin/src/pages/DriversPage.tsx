import React from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const DriversPage: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Drivers Management</h1>
            <p className="text-muted-foreground mt-1">
              Add drivers and assign them to services
            </p>
          </div>
          <Button>
            Add New Driver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Drivers Management</CardTitle>
            <CardDescription>
              This page will allow you to manage your drivers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Features coming soon:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Add and edit driver profiles</li>
              <li>Assign drivers to services</li>
              <li>Manage driver availability</li>
              <li>Track driver performance</li>
              <li>Generate driver access links</li>
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

export default DriversPage; 