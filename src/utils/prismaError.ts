import { createError } from '../middleware/error.middleware';
import { NextFunction } from 'express';

export interface PrismaError extends Error {
  code?: string;
}

export function isPrismaError(error: unknown): error is PrismaError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export function handlePrismaError(error: unknown, defaultMessage: string = 'Erro ao processar solicitação', next: NextFunction): void {
  if (!isPrismaError(error)) {
    return next(createError(defaultMessage, 500));
  }
  
  if (error.code === 'P2002') {
    return next(createError('Registro duplicado', 409));
  }
  
  if (error.code === 'P2025') {
    return next(createError(defaultMessage || 'Registro não encontrado', 404));
  }
  
  return next(createError(defaultMessage, 500));
}
