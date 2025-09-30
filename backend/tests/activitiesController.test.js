import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js'; // Adjust this path

describe('Activities Endpoints', () => {
  it('should add a new activity', async () => {
    const res = await request(app)
      .post('/activities/create')
      .send({
        day: 1,
        activity: {
          name: 'Test Activity',
          address: '123 Test St',
          type: 'Test',
          priceLevel: 1,
          rating: 5,
          longitude: 0,
          latitude: 0,
          startTime: '2025-09-30 14:00:00',
          duration: '01:00:00',
          estimatedCost: 20
        }
      });
    expect(res.status).toBe(200);
    expect(res.body.activity).toBeDefined();
    expect(res.body.activity.activity_name).toBe('Test Activity');
  });

  it('should get all activities for a day', async () => {
    const res = await request(app)
      .get('/activities/read/all')
      .send({ dayId: 1 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.activities)).toBe(true);
  });

  
});