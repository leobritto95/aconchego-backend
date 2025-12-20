import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { createError } from '../middleware/error.middleware';
import { handlePrismaError, isPrismaError } from '../utils/prismaError';

export const getAttendances = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId, studentId, startDate, endDate } = req.query;

    const where: any = {};

    if (classId) {
      where.classId = classId as string;
    }

    if (studentId) {
      where.studentId = studentId as string;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        Class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      success: true,
      data: attendances.map((att: any) => ({
        id: att.id,
        classId: att.classId,
        studentId: att.studentId,
        date: att.date,
        status: att.status,
        className: att.Class.name,
        createdAt: att.createdAt,
        updatedAt: att.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        Class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!attendance) {
      throw createError('Frequência não encontrada', 404);
    }

    res.json({
      success: true,
      data: {
        id: attendance.id,
        classId: attendance.classId,
        studentId: attendance.studentId,
        date: attendance.date,
        status: attendance.status,
        className: attendance.Class.name,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId, studentId, date, status } = req.body;

    if (!classId || !studentId || !date || !status) {
      throw createError('classId, studentId, date e status são obrigatórios', 400);
    }

    if (!['PRESENT', 'ABSENT'].includes(status.toUpperCase())) {
      throw createError('Status deve ser PRESENT ou ABSENT', 400);
    }

    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      throw createError('Classe não encontrada', 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!user) {
      throw createError('Usuário não encontrado', 404);
    }

    const attendance = await prisma.attendance.create({
      data: {
        classId,
        studentId,
        date: new Date(date),
        status: status.toUpperCase() as 'PRESENT' | 'ABSENT',
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
        id: attendance.id,
        classId: attendance.classId,
        studentId: attendance.studentId,
        date: attendance.date,
        status: attendance.status,
        className: attendance.Class.name,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      },
    });
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2002') {
      return next(createError('Já existe uma frequência registrada para esta data, classe e estudante', 409));
    }
    handlePrismaError(error, 'Erro ao criar frequência', next);
  }
};

export const updateAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { date, status } = req.body;

    const updateData: any = {};

    if (date) {
      updateData.date = new Date(date);
    }

    if (status) {
      if (!['PRESENT', 'ABSENT'].includes(status.toUpperCase())) {
        throw createError('Status deve ser PRESENT ou ABSENT', 400);
      }
      updateData.status = status.toUpperCase();
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: updateData,
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
      data: {
        id: attendance.id,
        classId: attendance.classId,
        studentId: attendance.studentId,
        date: attendance.date,
        status: attendance.status,
        className: attendance.Class.name,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      },
    });
  } catch (error) {
    handlePrismaError(error, 'Frequência não encontrada', next);
  }
};

export const deleteAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.attendance.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: true,
    });
  } catch (error) {
    handlePrismaError(error, 'Frequência não encontrada', next);
  }
};

export const registerAttendanceForClass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: classId } = req.params;
    const studentId = req.body.studentId || req.query.studentId;
    const { date, status } = req.body;

    if (!studentId || !date || !status) {
      throw createError('studentId, date e status são obrigatórios', 400);
    }

    const studentIdStr = String(studentId);

    if (!['PRESENT', 'ABSENT'].includes(status.toUpperCase())) {
      throw createError('Status deve ser PRESENT ou ABSENT', 400);
    }

    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      throw createError('Classe não encontrada', 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: studentIdStr },
    });

    if (!user) {
      throw createError('Usuário não encontrado', 404);
    }

    const attendance = await prisma.attendance.create({
      data: {
        classId,
        studentId: studentIdStr,
        date: new Date(date),
        status: status.toUpperCase() as 'PRESENT' | 'ABSENT',
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
        id: attendance.id,
        classId: attendance.classId,
        studentId: attendance.studentId,
        date: attendance.date,
        status: attendance.status,
        className: attendance.Class.name,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      },
    });
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2002') {
      return next(createError('Já existe uma frequência registrada para esta data, classe e estudante', 409));
    }
    handlePrismaError(error, 'Erro ao criar frequência', next);
  }
};




