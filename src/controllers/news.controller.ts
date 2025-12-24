import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { createError } from '../middleware/error.middleware';
import { handlePrismaError } from '../utils/prismaError';
import { getPaginationParams, getPaginationResult } from '../utils/pagination';

export const getNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.news.count(),
    ]);

    const pagination = getPaginationResult(total, page, limit);

    res.json({
      success: true,
      data: {
        data: news.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          publishedAt: item.publishedAt.toISOString(),
          author: item.author,
          imageUrl: item.imageUrl,
        })),
        ...pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getNewsById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const news = await prisma.news.findUnique({
      where: { id },
    });

    if (!news) {
      throw createError('Notícia não encontrada', 404);
    }

    res.json({
      success: true,
      data: {
        id: news.id,
        title: news.title,
        content: news.content,
        publishedAt: news.publishedAt.toISOString(),
        author: news.author,
        imageUrl: news.imageUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, author, imageUrl } = req.body;

    if (!title || !content) {
      throw createError('Título e conteúdo são obrigatórios', 400);
    }

    const news = await prisma.news.create({
      data: {
        title,
        content,
        author,
        imageUrl,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: news.id,
        title: news.title,
        content: news.content,
        publishedAt: news.publishedAt.toISOString(),
        author: news.author,
        imageUrl: news.imageUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, content, author, imageUrl } = req.body;

    const updated = await prisma.news.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(author !== undefined && { author }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        content: updated.content,
        publishedAt: updated.publishedAt.toISOString(),
        author: updated.author,
        imageUrl: updated.imageUrl,
      },
    });
  } catch (error) {
    handlePrismaError(error, 'Notícia não encontrada', next);
  }
};

export const deleteNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.news.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: true,
    });
  } catch (error) {
    handlePrismaError(error, 'Notícia não encontrada', next);
  }
};

export const searchNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.query;

    if (!query) {
      throw createError('Query de busca é obrigatória', 400);
    }

    const news = await prisma.news.findMany({
      where: {
        OR: [
          { title: { contains: query as string, mode: 'insensitive' } },
          { content: { contains: query as string, mode: 'insensitive' } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
    });

    res.json({
      success: true,
      data: news.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        publishedAt: item.publishedAt.toISOString(),
        author: item.author,
        imageUrl: item.imageUrl,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getLatestNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number.parseInt(req.query.limit as string) || 5;

    const news = await prisma.news.findMany({
      take: limit,
      orderBy: { publishedAt: 'desc' },
    });

    res.json({
      success: true,
      data: news.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        publishedAt: item.publishedAt.toISOString(),
        author: item.author,
        imageUrl: item.imageUrl,
      })),
    });
  } catch (error) {
    next(error);
  }
};
