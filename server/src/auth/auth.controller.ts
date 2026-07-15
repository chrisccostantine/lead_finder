import type { Request, Response } from 'express';
import { authService } from './auth.service.js';

export class AuthController {
  async setupStatus(_request: Request, response: Response) {
    response.json({ registrationOpen: await authService.isRegistrationOpen() });
  }

  async register(request: Request, response: Response) {
    response.status(201).json(await authService.register(request.body));
  }

  async login(request: Request, response: Response) {
    response.json(await authService.login(request.body));
  }

  async me(request: Request, response: Response) {
    response.json({ user: await authService.currentUser(request.auth!.userId) });
  }
}

export const authController = new AuthController();

