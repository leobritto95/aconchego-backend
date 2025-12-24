import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { createError } from '../middleware/error.middleware';
import { handlePrismaError, isPrismaError } from '../utils/prismaError';
import { AuthRequest } from '../middleware/auth.middleware';
import { getPaginationParams, getPaginationResult } from '../utils/pagination';

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);

    const where: any = {};

    if (req.query.role) {
      where.role = req.query.role;
    }

    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search as string, mode: 'insensitive' } },
        { email: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const pagination = getPaginationResult(total, page, limit);

    res.json({
      success: true,
      data: {
        data: users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.toLowerCase(),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
        ...pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw createError('Usuário não encontrado', 404);
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Usuário não autenticado', 401);
    }

    const allowedRoles = ['TEACHER', 'SECRETARY', 'ADMIN'];
    if (!allowedRoles.includes(req.user.role.toUpperCase())) {
      throw createError('Você não tem permissão para cadastrar usuários', 403);
    }

    const { email, password, name, role, classIds } = req.body;

    if (!email || !password || !name || !role) {
      throw createError('Email, senha, nome e role são obrigatórios', 400);
    }

    const validRoles = ['STUDENT', 'TEACHER', 'SECRETARY', 'ADMIN'];
    if (!validRoles.includes(role.toUpperCase())) {
      throw createError('Role inválido', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return next(createError('Email já está em uso', 409));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Se for aluno e tiver classIds, validar que as classes existem
    if (role.toUpperCase() === 'STUDENT' && classIds && Array.isArray(classIds) && classIds.length > 0) {
      const classes = await prisma.class.findMany({
        where: {
          id: { in: classIds },
        },
      });

      if (classes.length !== classIds.length) {
        throw createError('Uma ou mais classes não foram encontradas', 404);
      }
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name,
        role: role.toUpperCase(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Se for aluno e tiver classIds, matricular nas turmas
    const enrolledClasses = [];
    if (role.toUpperCase() === 'STUDENT' && classIds && Array.isArray(classIds) && classIds.length > 0) {
      for (const classId of classIds) {
        try {
          const classStudent = await prisma.classStudent.create({
            data: {
              classId,
              studentId: user.id,
            },
          });
          enrolledClasses.push({
            id: classStudent.id,
            classId: classStudent.classId,
            studentId: classStudent.studentId,
          });
        } catch (error: any) {
          // Ignora erro se o aluno já estiver matriculado na turma
          if (!isPrismaError(error) || error.code !== 'P2002') {
            throw error;
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        enrolledClasses: enrolledClasses.length > 0 ? enrolledClasses : undefined,
      },
    });
  } catch (error) {
    // Se já é um erro criado com createError, passar direto
    if ((error as any).statusCode) {
      return next(error);
    }
    
    // Tratar erro de constraint única do Prisma (email duplicado)
    if (isPrismaError(error) && error.code === 'P2002') {
      // Verificar se é erro de email duplicado
      const errorMeta = (error as any).meta;
      if (errorMeta?.target && Array.isArray(errorMeta.target) && errorMeta.target.includes('email')) {
        return next(createError('Email já está em uso', 409));
      }
      return next(createError('Registro duplicado', 409));
    }
    
    handlePrismaError(error, 'Erro ao criar usuário', next);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { email, password, name, role } = req.body;

    const updateData: any = {};

    if (email) {
      // Normalizar email (trim e lowercase)
      const normalizedEmail = email.trim().toLowerCase();
      
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser && existingUser.id !== id) {
        return next(createError('Email já está em uso', 409));
      }

      updateData.email = normalizedEmail;
    }

    if (name) {
      updateData.name = name;
    }

    if (role) {
      const validRoles = ['STUDENT', 'TEACHER', 'SECRETARY', 'ADMIN'];
      if (!validRoles.includes(role.toUpperCase())) {
        throw createError('Role inválido', 400);
      }
      updateData.role = role.toUpperCase();
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    // Se já é um erro criado com createError, passar direto
    if ((error as any).statusCode) {
      return next(error);
    }
    
    // Tratar erro de constraint única do Prisma (email duplicado)
    if (isPrismaError(error) && error.code === 'P2002') {
      // Verificar se é erro de email duplicado
      const errorMeta = (error as any).meta;
      if (errorMeta?.target && Array.isArray(errorMeta.target) && errorMeta.target.includes('email')) {
        return next(createError('Email já está em uso', 409));
      }
      return next(createError('Registro duplicado', 409));
    }
    
    handlePrismaError(error, 'Usuário não encontrado', next);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: true,
    });
  } catch (error) {
    handlePrismaError(error, 'Usuário não encontrado', next);
  }
};

export const getUserCounts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [total, students, teachers, secretaries, admins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.count({ where: { role: 'SECRETARY' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        students,
        teachers,
        secretaries,
        admins,
      },
    });
  } catch (error) {
    next(error);
  }
};






