import { describe, it, expect, vi, beforeEach } from 'vitest';
import { guestLogin } from '../controllers/authController'; 


describe('guestLogin', () => {
  let req, res;

  beforeEach(() => {
    req = {
      login: vi.fn((user, callback) => callback(null))
    };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
    process.env.ENVIRONMENT = 'development';
  });

  it('should create a guest user and return success', () => {
    guestLogin(req, res);

    expect(req.login).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      redirectUrl: 'http://localhost:5173/explore'
    });
  });

  it('should handle login errors', () => {
    req.login = vi.fn((user, callback) => callback(new Error('Login failed')));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    guestLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Failed to create guest session' 
    });
  });
});