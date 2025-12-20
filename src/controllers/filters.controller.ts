import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export const getStyles = async (_: Request, res: Response, next: NextFunction) => {
  try {
    const classes = await prisma.class.findMany({
      where: {
        style: { not: null },
      },
      select: { style: true },
      distinct: ['style'],
    });

    const styles = classes
      .map((cls) => cls.style)
      .filter((style): style is string => style !== null);

    res.json({
      success: true,
      data: styles,
    });
  } catch (error) {
    next(error);
  }
};

export const getClasses = async (_: Request, res: Response, next: NextFunction) => {
  try {
    const classes = await prisma.class.findMany({
      select: { name: true },
      distinct: ['name'],
    });

    const classNames = classes.map((cls) => cls.name);

    res.json({
      success: true,
      data: classNames,
    });
  } catch (error) {
    next(error);
  }
};

export const getYears = async (_: Request, res: Response, next: NextFunction) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      select: { date: true },
    });

    const years = Array.from(
      new Set(feedbacks.map((fb) => fb.date.getFullYear().toString()))
    ).sort((a, b) => Number.parseInt(a) - Number.parseInt(b));

    res.json({
      success: true,
      data: years,
    });
  } catch (error) {
    next(error);
  }
};
