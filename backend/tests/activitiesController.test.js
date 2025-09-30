import { describe, it, expect } from 'vitest'; 
import request from 'supertest';
import app from '../app.js'; 

//Groups all of the tests related to activity CRUD endpoints
describe('Activities Endpoints', () => {
  let createdActivityId;

//testing for creating an activity
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
    createdActivityId = res.body.activity.activity_id;
  });

  //test for reading all activities from a day
  it('should get all activities for a day', async () => {
    const res = await request(app)
      .get('/activities/read/all') //path to read all for an activity
      .send({ dayId: 1 }); // making mock day id of what day we reading activities from
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.activities)).toBe(true);
  });

  //test for reading one activity
  it('should read a single activity', async () => {
    const res = await request(app)
      .get('/activities/read/single') //path for reading single activity
      .send({ activityId: createdActivityId, activity: {} });
    expect(res.status).toBe(200);
    expect(res.body.activity).toBeDefined();
    expect(res.body.activity.activity_id).toBe(createdActivityId);
  });

  //test for updating an activity
  it('should update an activity', async () => {
    const res = await request(app)
      .put('/activities/update') //path for updating an activity
      .send({
        activityId: createdActivityId,
        activity: {
          startTime: '2025-09-30 15:00:00',
          duration: 120,
          estimatedCost: 30
        }
      });
      //checking for all updated values 
    expect(res.status).toBe(200);
    expect(res.body.activity).toBeDefined();
    expect(res.body.activity.activity_startTime).toBe('2025-09-30T19:00:00.000Z');
    const duration = res.body.activity.activity_duration;
    expect(typeof duration).toBe('object');
    expect(duration.hours).toBe(2);
    expect(res.body.activity.activity_price_estimated).toBe(30);
  });

  //test for deleting an activity
  it('should delete an activity', async () => {
    const res = await request(app)
      .delete('/activities/delete') //route for deleting 
      .send({ activityId: createdActivityId });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  //testing 404 error handling in reading a single activity
  it('should return 404 for reading a non-existent activity', async () => {
    const res = await request(app)
      .get('/activities/read/single')//route for reading single activity
      .send({ activityId: 999999, activity: {} });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  //testing 400 error handling in creating an activity
  it('should return 400 for missing required fields on add', async () => {
    const res = await request(app)
      .post('/activities/create')//route for create in activities
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/missing required fields/i);
  });
});