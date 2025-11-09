import { describe, it, expect, vi } from 'vitest';
import { readAllImages, readOneImage } from '../controllers/imageController.js';
import { sql } from "../config/db.js";

// Mock DB
vi.mock("../config/db.js", () => ({
  sql: vi.fn(),
}));

describe('Image endpoints', () => {

  // Manually mock the request and response objects
  const createMockRequest = (query = {}, body = {}) => ({
    query,
    body,
  });

  const createMockResponse = () => {
    const res = {};
    res.statusCode = 200;
    res._data = null;
    res.json = (data) => {
      res._data = data;
      return res;
    };
    res.status = (statusCode) => {
      res.statusCode = statusCode;
      return res;
    };
    res._getData = () => res._data;
    return res;
  };

  // Test for readAllImages function
  describe('readAllImages', () => {
    it('should retrieve all images and return them in the correct format', async () => {
      // Mock data returned by SQL query
      const mockSqlResult = [
        { image_id: 1, image_name: 'image1', image_url: 'https://res.cloudinary.com/yourcloud/image/upload/image_1.png' },
        { image_id: 2, image_name: 'image2', image_url: 'https://res.cloudinary.com/yourcloud/image/upload/image_2.png' },
      ];

      sql.mockResolvedValue(mockSqlResult);

      // Create mock request and response objects
      const req = createMockRequest();
      const res = createMockResponse();

      await readAllImages(req, res);

      // Check the response status and body
      expect(res.statusCode).toBe(200);
      expect(res._getData()).toEqual([
        {
          image_id: 1,
          image_name: 'image1',
          imageUrl: 'https://res.cloudinary.com/yourcloud/image/upload/w_150,h_150,c_fill/image_1.png'
        },
        {
          image_id: 2,
          image_name: 'image2',
          imageUrl: 'https://res.cloudinary.com/yourcloud/image/upload/w_150,h_150,c_fill/image_2.png'
        },
      ]);
    });

    it('should handle errors gracefully', async () => {
      // Mock SQL error
      sql.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest();
      const res = createMockResponse();

      await readAllImages(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getData()).toEqual({ error: 'Internal Server Error' });
    });
  });

  // Test for readOneImage function
  describe('readOneImage', () => {
    it('should retrieve a specific image by ID and return the image URL', async () => {
      // Mock image ID and SQL result
      const imageId = 1;
      const mockSqlResult = [{image_url: 'https://res.cloudinary.com/yourcloud/image/upload/image_1.png'}];

      sql.mockResolvedValue(mockSqlResult);

      const req = createMockRequest({ imageId });
      const res = createMockResponse();

      await readOneImage(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getData()).toEqual('https://res.cloudinary.com/yourcloud/image/upload/image_1.png');
    });

    it('should return 404 if the image is not found', async () => {
      const imageId = 1;
      const mockSqlResult = [];

      sql.mockResolvedValue(mockSqlResult);

      const req = createMockRequest({ imageId });
      const res = createMockResponse();

      await readOneImage(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getData()).toEqual({ error: 'Image not found' });
    });

    it('should handle errors gracefully', async () => {
      sql.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest();
      const res = createMockResponse();

      await readOneImage(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getData()).toEqual({ error: 'Internal Server Error' });
    });
  });
});
