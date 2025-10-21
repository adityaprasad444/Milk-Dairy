import React from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';

const OrderFilters = ({ filters, onFilter, onReset }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilter({ ...filters, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  return (
    <Form onSubmit={handleSubmit} className="mb-4">
      <Row className="g-2">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Status</Form.Label>
            <Form.Select 
              name="status" 
              value={filters.status || ''}
              onChange={handleChange}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </Form.Select>
          </Form.Group>
        </Col>
        
        <Col md={3}>
          <Form.Group>
            <Form.Label>From Date</Form.Label>
            <Form.Control
              type="date"
              name="dateFrom"
              value={filters.dateFrom || ''}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
        
        <Col md={3}>
          <Form.Group>
            <Form.Label>To Date</Form.Label>
            <Form.Control
              type="date"
              name="dateTo"
              value={filters.dateTo || ''}
              onChange={handleChange}
              min={filters.dateFrom}
            />
          </Form.Group>
        </Col>
        
        <Col md={3} className="d-flex align-items-end">
          <Button 
            variant="outline-secondary" 
            onClick={onReset}
            className="me-2"
          >
            Reset
          </Button>
          <Button type="submit" variant="primary">
            Apply Filters
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default OrderFilters;
