import prisma from '../../utils/prisma';

export async function seedNews(): Promise<void> {
  console.log('📰 Seeding news...');

  const news = await prisma.news.create({
    data: {
      title: 'Bem-vindos ao Aconchego!',
      content: 'Estamos muito felizes em recebê-los em nossa plataforma. Aqui você pode acompanhar seus feedbacks, eventos e muito mais!',
      author: 'Equipe Aconchego',
      imageUrl: 'https://via.placeholder.com/800x400',
    },
  });
  console.log('✅ News created:', news.title);
}

