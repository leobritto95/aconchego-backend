import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { createError } from '../middleware/error.middleware';
import { handlePrismaError, isPrismaError } from '../utils/prismaError';
import { normalizeDate, getEndOfDay } from '../utils/dateUtils';

interface ScheduleTime {
  startTime: string;
  endTime: string;
}

type ScheduleTimes = Record<string, ScheduleTime>;

/**
 * Verifica se uma aula já começou baseado no horário de início
 */
function hasClassStarted(
  scheduleTimes: ScheduleTimes,
  dayOfWeek: number,
  currentTime: Date
): boolean {
  const daySchedule = scheduleTimes[dayOfWeek.toString()];
  if (!daySchedule?.startTime) {
    return false;
  }

  const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number);
  const classStartTime = new Date(currentTime);
  classStartTime.setHours(startHour, startMinute, 0, 0);

  return currentTime >= classStartTime;
}

/**
 * Constrói filtro de data para consultas
 */
function buildDateFilter(startDate?: string, endDate?: string) {
  const filter: { gte?: Date; lte?: Date } = {};

  if (startDate) {
    filter.gte = normalizeDate(startDate);
  }

  if (endDate) {
    filter.lte = getEndOfDay(endDate);
  }

  return filter;
}

export const getClassExceptions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(
      startDate as string | undefined,
      endDate as string | undefined
    );

    // Construir filtro: se classId for fornecido, filtrar por ele; caso contrário, buscar todas
    const whereFilter: { classId?: string; date?: { gte?: Date; lte?: Date } } = {};
    
    if (classId) {
      whereFilter.classId = classId as string;
    }

    if (Object.keys(dateFilter).length > 0) {
      whereFilter.date = dateFilter;
    }

    const exceptions = await prisma.classException.findMany({
      where: Object.keys(whereFilter).length > 0 ? whereFilter : {},
      orderBy: { date: 'asc' },
      include: {
        Class: {
          select: {
            id: true,
            name: true,
            style: true,
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
        classStyle: ex.Class.style,
        createdAt: ex.createdAt,
        updatedAt: ex.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

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

    const exceptionDate = normalizeDate(date);
    const today = normalizeDate(new Date());
    const now = new Date();

    // Validar que a data não é no passado
    if (exceptionDate < today) {
      throw createError('Não é possível cancelar aulas em datas passadas', 400);
    }

    // Se a data é hoje, verificar se o horário da aula já passou
    if (exceptionDate.getTime() === today.getTime()) {
      const scheduleTimes = classItem.scheduleTimes as unknown as ScheduleTimes;
      const dayOfWeek = exceptionDate.getDay();

      if (hasClassStarted(scheduleTimes, dayOfWeek, now)) {
        throw createError('Não é possível cancelar aulas que já começaram', 400);
      }
    }

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

