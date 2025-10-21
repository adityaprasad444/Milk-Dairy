import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrders, getSubscriptionOrders } from '../../services/orderService';
import { Tabs, Tab, Table, Badge, Spinner, Alert } from 'react-bootstrap';

const OrdersList = () => {
  const [activeTab, setActiveTab] = useState('regular');

  // Fetch regular orders
  const { 
    data: regularOrdersData, 
    isLoading: isLoadingRegular, 
    error: regularError 
  } = useQuery(
    ['orders', 'regular'],
    () => getOrders(), // No filter needed for regular orders
    { enabled: activeTab === 'regular' }
  );
  const regularOrders = regularOrdersData?.data || [];

  // Fetch subscription orders
  const { 
    data: subscriptionOrdersData, 
    isLoading: isLoadingSubscription, 
    error: subscriptionError 
  } = useQuery(
    ['subscription-orders'], // Use a unique query key
    () => getSubscriptionOrders(),
    { enabled: activeTab === 'subscription' }
  );
  const subscriptionOrders = subscriptionOrdersData?.data || [];

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'primary';
      case 'IN_TRANSIT': return 'info';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderOrders = (orders, isLoading, error) => {
    if (isLoading) {
      return (
        <div className="text-center my-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger">
          Error loading orders: {error.message}
        </Alert>
      );
    }

    if (orders.length === 0) {
      return <Alert variant="info">No orders found</Alert>;
    }

    return (
      <div className="table-responsive">
        <Table striped bordered hover className="mt-3">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>{order.orderNumber}</td>
                <td>{formatDate(order.createdAt)}</td>
                <td>
                  <Badge bg={getStatusBadgeVariant(order.status)}>
                    {order.status}
                  </Badge>
                </td>
                <td>₹{order.totalAmount?.toFixed(2) || '0.00'}</td>
                <td>
                  {activeTab === 'subscription' ? (
                    <Badge bg="info">Subscription</Badge>
                  ) : (
                    <Badge bg="secondary">Regular</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <h2>My Orders</h2>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
        id="orders-tabs"
      >
        <Tab eventKey="regular" title="Regular Orders">
          {renderOrders(regularOrders, isLoadingRegular, regularError)}
        </Tab>
        <Tab eventKey="subscription" title="Subscription Orders">
          {renderOrders(subscriptionOrders, isLoadingSubscription, subscriptionError)}
        </Tab>
      </Tabs>
    </div>
  );
};

export default OrdersList;
