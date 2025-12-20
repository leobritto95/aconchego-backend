import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { createError } from "../middleware/error.middleware";
import { handlePrismaError } from "../utils/prismaError";

export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { start, end } = req.query;

    const where: any = {};

    if (start || end) {
      where.OR = [];
      if (start) {
        where.OR.push({ start: { gte: new Date(start as string) } });
      }
      if (end) {
        where.OR.push({ end: { lte: new Date(end as string) } });
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { start: "asc" },
    });

    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      description: event.description,
    }));

    res.json({
      success: true,
      data: formattedEvents,
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
