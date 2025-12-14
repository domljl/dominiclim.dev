import React from 'react';
import projectsData from '../data/projects.json';
import { kineGit, portfolioWebsite, ocbcVTM, facialRecognition } from '../assets';

interface Project {
  title: string;
  description: string;
  technologies: string[];
  github: string;
  demo: string;
  image: string;
}

interface ProjectCardProps {
  project: Project;
  index: number;
}

const getProjectImage = (imagePath: string): string | null => {
  switch (imagePath) {
    case '/assets/projectsImg/portfolioWebsite.png':
      return portfolioWebsite.src;
    case '/assets/projectsImg/kineGit.png':
      return kineGit.src;
    case '/assets/projectsImg/ocbcVTM.png':
      return ocbcVTM.src;
    case '/assets/projectsImg/facialRecognition.png':
      return facialRecognition.src;
    case '/placeholder-project.jpg':
      return null;
    default:
      return null;
  }
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  return (
    <div
      className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border border-gray-100 dark:border-gray-700 overflow-hidden"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 rounded-3xl"></div>

      <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 rounded-3xl p-[1px]">
        <div className="w-full h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl"></div>
      </div>

      <div className="relative p-8 h-full flex flex-col">
        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-purple-900/30 rounded-2xl mb-6 overflow-hidden">
          {(() => {
            const imageSrc = getProjectImage(project.image);
            return imageSrc ? (
              <img
                src={imageSrc}
                alt={`${project.title} preview`}
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center">
                        <div class="text-6xl opacity-20">🚀</div>
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-6xl opacity-20">🚀</div>
              </div>
            );
          })()}
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          {project.title}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow leading-relaxed">
          {project.description}
        </p>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech, techIndex) => (
              <span
                key={techIndex}
                className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/20 dark:to-purple-400/20 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full border border-blue-200 dark:border-blue-700"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-auto">
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 group/btn relative inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-800 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
            <svg className="w-4 h-4 mr-2 relative z-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
            <span className="relative z-10 text-sm">GitHub</span>
          </a>

          <a
            href={project.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 group/btn relative inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
            <svg className="w-4 h-4 mr-2 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="relative z-10 text-sm">{project.title === 'OCBC Virtual Teller Machine' || project.title === 'Facial Recognition Authentication' ? 'Video Demo' : 'Live Demo'}</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export const Projects: React.FC = () => {
  return (
    <section id="projects" className="py-16 sm:py-24 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-6">
            Projects
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            A collection of projects that showcase my development skills and passion for creating innovative solutions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projectsData.map((project, index) => (
            <ProjectCard
              key={project.title}
              project={project}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
