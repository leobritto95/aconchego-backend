import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { createError } from '../middleware/error.middleware';
import { handlePrismaError, isPrismaError } from '../utils/prismaError';

/**
 * Cancela um dia específico de uma classe
 */
export const createClassException = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId, date, reason } = req.body;

    if (!classId || !date) {
      throw createError('classId e date são obrigatórios', 400);
    }

    // Verificar se a classe existe
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classItem) {
      throw createError('Classe não encontrada', 404);
    }

    // Normalizar data (remover horas, manter apenas a data)
    const exceptionDate = new Date(date);
    exceptionDate.setHours(0, 0, 0, 0);

    const exception = await prisma.classException.create({
      data: {
        classId,
        date: exceptionDate,
        reason: reason || null,
      },
      include: {
        Class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: exception.id,
        classId: exception.classId,
        date: exception.date,
        reason: exception.reason,
        className: exception.Class.name,
        createdAt: exception.createdAt,
        updatedAt: exception.updatedAt,
      },
    });
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2002') {
      return next(
        createError('Já existe uma exceção para esta data', 409)
      );
    }
    handlePrismaError(error, 'Erro ao criar exceção', next);
  }
};

/**
 * Lista exceções de uma classe
 */
export const getClassExceptions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId } = req.params;

    const exceptions = await prisma.classException.findMany({
      where: { classId },
      orderBy: { date: 'asc' },
      include: {
        Class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: exceptions.map((ex) => ({
        id: ex.id,
        classId: ex.classId,
        date: ex.date,
        reason: ex.reason,
        className: ex.Class.name,
        createdAt: ex.createdAt,
        updatedAt: ex.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove uma exceção (reativa o dia no calendário)
 */
export const deleteClassException = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.classException.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: true,
    });
  } catch (error) {
    handlePrismaError(error, 'Exceção não encontrada', next);
  }
};

