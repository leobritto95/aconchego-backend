import prisma from '../../utils/prisma';

export async function seedNews(): Promise<void> {
  console.log('📰 Seeding news...');

  const now = new Date();
  
  // Notícia mais antiga (7 dias atrás)
  const news1 = await prisma.news.create({
    data: {
      title: 'Bem-vindos ao Aconchego!',
      content: 'Estamos muito felizes em recebê-los em nossa plataforma. Aqui você pode acompanhar seus feedbacks, eventos e muito mais!',
      author: 'Equipe Aconchego',
      publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
    },
  });
  console.log('✅ News created:', news1.title);

  // Notícia de 3 dias atrás
  const news2 = await prisma.news.create({
    data: {
      title: 'Novo Sistema de Feedback Implementado',
      content: 'Temos o prazer de anunciar que nosso novo sistema de feedback está totalmente funcional. Agora os alunos podem receber avaliações detalhadas sobre seu desempenho nas aulas, com parâmetros específicos e comentários personalizados dos professores. Este sistema visa melhorar a comunicação entre alunos e professores, proporcionando um acompanhamento mais próximo e eficaz do desenvolvimento de cada estudante.',
      author: 'Administração',
      publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
    },
  });
  console.log('✅ News created:', news2.title);

  // Notícia mais recente (hoje)
  const news3 = await prisma.news.create({
    data: {
      title: 'Calendário de Eventos Atualizado',
      content: 'Confira as últimas atualizações no calendário de eventos! Adicionamos novos workshops, palestras e atividades especiais para este mês. Não perca a oportunidade de participar e expandir seus conhecimentos. Todos os eventos estão disponíveis na seção de calendário da plataforma.',
      author: 'Equipe de Eventos',
      imageUrl: 'https://schroeder.sc.gov.br/uploads/sites/353/2021/12/3201297.png',
      publishedAt: now,
    },
  });
  console.log('✅ News created:', news3.title);
}

