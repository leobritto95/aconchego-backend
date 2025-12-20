import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { createError } from '../middleware/error.middleware';

interface ParameterValue {
  name: string;
  score: number;
}

function buildParameters(fb: any): Record<string, ParameterValue> {
  if (fb.parameters && typeof fb.parameters === 'object' && !Array.isArray(fb.parameters)) {
    const params: Record<string, ParameterValue> = {};
    Object.entries(fb.parameters).forEach(([key, value]: [string, any]) => {
      if (value && typeof value === 'object' && typeof value.name === 'string' && typeof value.score === 'number') {
        params[key] = { name: value.name, score: value.score };
      }
    });
    return params;
  }
  return {};
}

export const getFeedbacks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (req.query.userId) {
      where.studentId = req.query.userId as string;
    }
    if (req.query.startDate || req.query.endDate) {
      where.date = {};
      if (req.query.startDate) {
        where.date.gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        where.date.lte = new Date(req.query.endDate as string);
      }
    }
    if (req.query.style || req.query.class) {
      where.Class = {};
      if (req.query.style) {
        where.Class.style = req.query.style;
      }
      if (req.query.class) {
        where.Class.name = req.query.class;
      }
    }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          Class: {
            select: {
              id: true,
              name: true,
              style: true,
            },
          },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        data: feedbacks.map((fb) => ({
          id: fb.id,
          studentId: fb.studentId,
          classId: fb.classId,
          style: fb.Class?.style || null,
          class: fb.Class?.name || null,
          date: fb.date.toISOString(),
          average: fb.average,
          status: fb.status.toLowerCase(),
          evaluatorFeedback: fb.evaluatorFeedback,
          parameters: buildParameters(fb),
        })),
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedbackById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
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

    if (!feedback) {
      throw createError('Feedback não encontrado', 404);
    }

    res.json({
      success: true,
      data: {
        id: feedback.id,
        studentId: feedback.studentId,
        classId: feedback.classId,
        style: feedback.Class?.style || null,
        class: feedback.Class?.name || null,
        date: feedback.date.toISOString(),
        average: feedback.average,
        status: feedback.status.toLowerCase(),
        evaluatorFeedback: feedback.evaluatorFeedback,
        parameters: buildParameters(feedback),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      studentId,
      classId,
      date,
      average,
      status,
      evaluatorFeedback,
      parameters,
    } = req.body;

    if (!studentId || !classId || !date || average === undefined) {
      throw createError('Campos obrigatórios: studentId, classId, date, average', 400);
    }

    // Verificar se a classe existe
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      throw createError('Classe não encontrada', 404);
    }

    const feedback = await prisma.feedback.create({
      data: {
        studentId,
        classId,
        date: new Date(date),
        average: Number.parseFloat(average),
        status: (status || 'PENDING').toUpperCase(),
        evaluatorFeedback,
        parameters: parameters || null,
      },
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

    res.status(201).json({
      success: true,
      data: {
        id: feedback.id,
        studentId: feedback.studentId,
        classId: feedback.classId,
        style: feedback.Class?.style || null,
        class: feedback.Class?.name || null,
        date: feedback.date.toISOString(),
        average: feedback.average,
        status: feedback.status.toLowerCase(),
        evaluatorFeedback: feedback.evaluatorFeedback,
        parameters: buildParameters(feedback),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      studentId,
      classId,
      date,
      average,
      status,
      evaluatorFeedback,
      parameters,
    } = req.body;

    const existingFeedback = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!existingFeedback) {
      throw createError('Feedback não encontrado', 404);
    }

    // Se classId foi alterado, verificar se a nova classe existe
    if (classId && classId !== existingFeedback.classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: classId },
      });
      if (!classExists) {
        throw createError('Classe não encontrada', 404);
      }
    }

    const updateData: any = {};
    if (studentId !== undefined) updateData.studentId = studentId;
    if (classId !== undefined) updateData.classId = classId;
    if (date !== undefined) updateData.date = new Date(date);
    if (average !== undefined) updateData.average = Number.parseFloat(average);
    if (status !== undefined) updateData.status = status.toUpperCase();
    if (evaluatorFeedback !== undefined) updateData.evaluatorFeedback = evaluatorFeedback;
    if (parameters !== undefined) {
      updateData.parameters = parameters;
    }

    const feedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
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
      data: {
        id: feedback.id,
        studentId: feedback.studentId,
        classId: feedback.classId,
        style: feedback.Class?.style || null,
        class: feedback.Class?.name || null,
        date: feedback.date.toISOString(),
        average: feedback.average,
        status: feedback.status.toLowerCase(),
        evaluatorFeedback: feedback.evaluatorFeedback,
        parameters: buildParameters(feedback),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.feedback.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: true,
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupedClasses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = {};

    if (req.query.startDate || req.query.endDate) {
      where.date = {};
      if (req.query.startDate) {
        where.date.gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        where.date.lte = new Date(req.query.endDate as string);
      }
    }

    if (req.query.style || req.query.class) {
      where.Class = {};
      if (req.query.style) {
        where.Class.style = req.query.style;
      }
      if (req.query.class) {
        where.Class.name = req.query.class;
      }
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      select: {
        classId: true,
        date: true,
        Class: {
          select: {
            name: true,
            style: true,
          },
        },
      },
    });

    const grouped = feedbacks.reduce((acc: any, fb) => {
      if (!fb.Class) return acc;
      const key = `${fb.classId}-${fb.Class.name}`;
      if (!acc[key]) {
        acc[key] = {
          classId: fb.classId,
          className: fb.Class.name,
          style: fb.Class.style,
          date: fb.date.toISOString(),
          feedbackCount: 0,
        };
      }
      acc[key].feedbackCount++;
      if (new Date(fb.date) > new Date(acc[key].date)) {
        acc[key].date = fb.date.toISOString();
      }
      return acc;
    }, {});

    res.json({
      success: true,
      data: Object.values(grouped),
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentGroupedClasses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      throw createError('userId é obrigatório', 400);
    }

    const where: any = {
      studentId: userId as string,
    };

    if (req.query.startDate || req.query.endDate) {
      where.date = {};
      if (req.query.startDate) {
        where.date.gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        where.date.lte = new Date(req.query.endDate as string);
      }
    }

    if (req.query.style || req.query.class) {
      where.Class = {};
      if (req.query.style) {
        where.Class.style = req.query.style;
      }
      if (req.query.class) {
        where.Class.name = req.query.class;
      }
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      select: {
        classId: true,
        date: true,
        Class: {
          select: {
            name: true,
            style: true,
          },
        },
      },
    });

    const grouped = feedbacks.reduce((acc: any, fb) => {
      if (!fb.Class) return acc;
      const key = `${fb.classId}-${fb.Class.name}`;
      if (!acc[key]) {
        acc[key] = {
          classId: fb.classId,
          className: fb.Class.name,
          style: fb.Class.style,
          date: fb.date.toISOString(),
          feedbackCount: 0,
        };
      }
      acc[key].feedbackCount++;
      if (new Date(fb.date) > new Date(acc[key].date)) {
        acc[key].date = fb.date.toISOString();
      }
      return acc;
    }, {});

    res.json({
      success: true,
      data: Object.values(grouped),
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedbacksByClassId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;

    const feedbacks = await prisma.feedback.findMany({
      where: { classId },
      include: {
        Class: {
          select: {
            id: true,
            name: true,
            style: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      success: true,
      data: feedbacks.map((fb) => ({
        id: fb.id,
        studentId: fb.studentId,
        classId: fb.classId,
        style: fb.Class?.style || null,
        class: fb.Class?.name || null,
        date: fb.date.toISOString(),
        average: fb.average,
        status: fb.status.toLowerCase(),
        evaluatorFeedback: fb.evaluatorFeedback,
        parameters: buildParameters(fb),
      })),
    });
  } catch (error) {
    next(error);
  }
};






