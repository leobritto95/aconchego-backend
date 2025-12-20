import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { createError } from "../middleware/error.middleware";
import { handlePrismaError } from "../utils/prismaError";
import { expandRecurringClasses } from "../utils/recurrenceUtils";
import { AuthRequest } from "../middleware/auth.middleware";

export const getEvents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start, end } = req.query;

    // ===== 1. BUSCAR EVENTOS ÚNICOS =====
    const whereEvents: any = {};

    if (start || end) {
      whereEvents.OR = [];
      if (start) {
        whereEvents.OR.push({ start: { gte: new Date(start as string) } });
      }
      if (end) {
        whereEvents.OR.push({ end: { lte: new Date(end as string) } });
      }
    }

    const singleEvents = await prisma.event.findMany({
      where: whereEvents,
      orderBy: { start: "asc" },
    });

    const formattedSingleEvents = singleEvents.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      backgroundColor: event.backgroundColor || "#3b82f6",
      borderColor: event.borderColor || "#3b82f6",
      description: event.description,
      extendedProps: {
        type: "single-event",
      },
    }));

    // ===== 2. BUSCAR TODAS AS CLASSES ATIVAS =====
    const startDate = start
      ? new Date(start as string)
      : new Date();
    const endDate = end
      ? new Date(end as string)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias à frente se não especificado

    // Buscar todas as classes ativas
    const classes = await prisma.class.findMany({
      where: {
        active: true,
        recurringDays: { isEmpty: false },
        startDate: { not: undefined },
        // Verificar se está dentro do período de recorrência
        OR: [
          { endDate: null }, // Sem fim definido
          {
            AND: [
              { startDate: { lte: endDate } }, // Começa antes do fim do range
              {
                OR: [
                  { endDate: { gte: startDate } }, // Termina depois do início do range
                ],
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        style: true,
        description: true,
        recurringDays: true,
        scheduleTimes: true,
        startDate: true,
        endDate: true,
      },
    });

    // ===== 3. BUSCAR EXCEÇÕES (dias cancelados) =====
    const classIds = classes.map((c) => c.id);
    const exceptions =
      classIds.length > 0
        ? await prisma.classException.findMany({
            where: {
              classId: { in: classIds },
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            select: {
              classId: true,
              date: true,
            },
          })
        : [];

    // ===== 3.5. BUSCAR MATRÍCULAS DO ALUNO (se autenticado como estudante) =====
    let enrolledClassIds = new Set<string>();
    if (req.user && req.user.role === 'STUDENT') {
      const enrollments = await prisma.classStudent.findMany({
        where: {
          studentId: req.user.id,
          classId: { in: classIds },
        },
        select: {
          classId: true,
        },
      });
      enrolledClassIds = new Set(enrollments.map((e) => e.classId));
    }

    // ===== 4. EXPANDIR CLASSES EM EVENTOS =====
    const expandedClassEvents = expandRecurringClasses(
      classes.map((c) => ({
        id: c.id,
        name: c.name,
        style: c.style,
        description: c.description,
        recurringDays: c.recurringDays,
        scheduleTimes: c.scheduleTimes as Record<string, { startTime: string; endTime: string }>,
        startDate: c.startDate,
        endDate: c.endDate,
        backgroundColor: "#10b981", // Verde padrão (matriculado)
        borderColor: "#059669",
      })),
      exceptions.map((e) => ({
        classId: e.classId,
        date: e.date,
      })),
      startDate,
      endDate,
      enrolledClassIds // Passar Set de classes matriculadas
    );

    // ===== 5. COMBINAR E RETORNAR =====
    const allEvents = [...formattedSingleEvents, ...expandedClassEvents];

    res.json({
      success: true,
      data: allEvents,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw createError("Evento não encontrado", 404);
    }

    res.json({
      success: true,
      data: {
        id: event.id,
        title: event.title,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        description: event.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, start, end, description, backgroundColor, borderColor } =
      req.body;

    if (!title || !start || !end) {
      throw createError("Título, início e fim são obrigatórios", 400);
    }

    const event = await prisma.event.create({
      data: {
        title,
        start: new Date(start),
        end: new Date(end),
        description,
        backgroundColor: backgroundColor || "#3b82f6",
        borderColor: borderColor || "#3b82f6",
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: event.id,
        title: event.title,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        description: event.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, start, end, description, backgroundColor, borderColor } =
      req.body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(start && { start: new Date(start) }),
        ...(end && { end: new Date(end) }),
        ...(description !== undefined && { description }),
        ...(backgroundColor && { backgroundColor }),
        ...(borderColor && { borderColor }),
      },
    });

    res.json({
      success: true,
      data: {
        id: event.id,
        title: event.title,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        description: event.description,
      },
    });
  } catch (error) {
    handlePrismaError(error, "Evento não encontrado", next);
  }
};

export const deleteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.event.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: true,
    });
  } catch (error) {
    handlePrismaError(error, "Evento não encontrado", next);
  }
};
