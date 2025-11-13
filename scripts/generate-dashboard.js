#!/usr/bin/env node

/**
 * Dashboard Generator for Metodología INTEGRA
 * 
 * Reads PROYECTO.md and generates a visual dashboard (README-DASHBOARD.md)
 * with project statistics, task distribution, and progress visualization.
 * 
 * Usage:
 *   node metodologia-integra/scripts/generate-dashboard.js
 * 
 * Output:
 *   README-DASHBOARD.md (in project root)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  projectFile: 'PROYECTO.md',
  outputFile: 'README-DASHBOARD.md',
  checkpointsDir: 'Checkpoints',
  contextDir: 'context',
  adrDir: 'metodologia-integra/context/decisions'
};

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Parse PROYECTO.md
function parseProyecto(content) {
  const tasks = [];
  const lines = content.split('\n');
  
  let currentTask = null;
  let inTaskBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect task header: ### [ID] Nombre
    const taskMatch = line.match(/^###\s+\[([^\]]+)\]\s+(.+)$/);
    if (taskMatch) {
      if (currentTask) tasks.push(currentTask);
      
      currentTask = {
        id: taskMatch[1],
        name: taskMatch[2],
        priority: null,
        estimation: null,
        assigned: null,
        sprint: null,
        tags: [],
        dependencies: [],
        blockers: [],
        status: 'pending'
      };
      inTaskBlock = true;
      continue;
    }
    
    if (!inTaskBlock || !currentTask) continue;
    
    // Stop at next task or major section
    if (line.startsWith('##') && !line.startsWith('###')) {
      inTaskBlock = false;
      if (currentTask) tasks.push(currentTask);
      currentTask = null;
      continue;
    }
    
    // Parse metadata
    const priorityMatch = line.match(/Prioridad:\*\*\s+(🔴|🟡|🟢)/);
    if (priorityMatch) currentTask.priority = priorityMatch[1];
    
    const estimationMatch = line.match(/Estimación:\*\*\s+(\d+)h?\s*(\d+)?m?/);
    if (estimationMatch) {
      const hours = parseInt(estimationMatch[1]) || 0;
      const minutes = parseInt(estimationMatch[2]) || 0;
      currentTask.estimation = hours + minutes / 60;
    }
    
    const assignedMatch = line.match(/Asignado:\*\*\s+(SOFIA|CODEX|GEMINI|Sin asignar)/);
    if (assignedMatch) currentTask.assigned = assignedMatch[1];
    
    const sprintMatch = line.match(/Sprint:\*\*\s+(.+)/);
    if (sprintMatch) currentTask.sprint = sprintMatch[1].trim();
    
    const tagsMatch = line.match(/Tags:\*\*\s+(.+)/);
    if (tagsMatch) {
      currentTask.tags = tagsMatch[1].match(/`#[^`]+`/g)?.map(t => t.replace(/`/g, '')) || [];
    }
    
    // Detect completion status
    if (line.includes('✅') || line.includes('[x]') || line.match(/Estado:\*\*\s+✅/)) {
      currentTask.status = 'completed';
    } else if (line.includes('🚧') || line.match(/Estado:\*\*\s+🚧/)) {
      currentTask.status = 'in-progress';
    }
  }
  
  if (currentTask) tasks.push(currentTask);
  
  return tasks;
}

// Generate statistics
function generateStats(tasks) {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    
    byPriority: {
      high: tasks.filter(t => t.priority === '🔴').length,
      medium: tasks.filter(t => t.priority === '🟡').length,
      low: tasks.filter(t => t.priority === '🟢').length
    },
    
    byAgent: {
      SOFIA: tasks.filter(t => t.assigned === 'SOFIA').length,
      CODEX: tasks.filter(t => t.assigned === 'CODEX').length,
      GEMINI: tasks.filter(t => t.assigned === 'GEMINI').length,
      unassigned: tasks.filter(t => !t.assigned || t.assigned === 'Sin asignar').length
    },
    
    totalEstimatedHours: tasks.reduce((sum, t) => sum + (t.estimation || 0), 0),
    completedHours: tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.estimation || 0), 0)
  };
  
  stats.completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;
  
  stats.remainingHours = stats.totalEstimatedHours - stats.completedHours;
  
  return stats;
}

// Generate progress bar
function progressBar(percentage, length = 20) {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// Count files in directory
function countFiles(dirPath, extension = '.md') {
  try {
    if (!fs.existsSync(dirPath)) return 0;
    const files = fs.readdirSync(dirPath);
    return files.filter(f => f.endsWith(extension)).length;
  } catch (error) {
    return 0;
  }
}

// Generate dashboard markdown
function generateDashboard(stats, tasks) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];
  
  const checkpointCount = countFiles(CONFIG.checkpointsDir);
  const specCount = countFiles(CONFIG.contextDir);
  const adrCount = countFiles(CONFIG.adrDir);
  
  let md = `# 📊 Dashboard del Proyecto Farianergy\n\n`;
  md += `> **Generado automáticamente** | Fecha: ${dateStr} ${timeStr}\n\n`;
  md += `---\n\n`;
  
  // Overview
  md += `## 🎯 Resumen General\n\n`;
  md += `| Métrica | Valor | Visualización |\n`;
  md += `|---------|-------|---------------|\n`;
  md += `| **Tareas Totales** | ${stats.total} | — |\n`;
  md += `| **Completadas** | ${stats.completed} | ✅ ${stats.completionRate}% |\n`;
  md += `| **En Progreso** | ${stats.inProgress} | 🚧 |\n`;
  md += `| **Pendientes** | ${stats.pending} | ⏳ |\n`;
  md += `| **Progreso Global** | ${stats.completionRate}% | ${progressBar(stats.completionRate)} |\n\n`;
  
  // Time tracking
  md += `## ⏱️ Seguimiento de Tiempo\n\n`;
  md += `| Métrica | Horas |\n`;
  md += `|---------|-------|\n`;
  md += `| **Total Estimado** | ${stats.totalEstimatedHours.toFixed(1)}h |\n`;
  md += `| **Horas Completadas** | ${stats.completedHours.toFixed(1)}h |\n`;
  md += `| **Horas Restantes** | ${stats.remainingHours.toFixed(1)}h |\n`;
  md += `| **Velocidad** | ${(stats.completedHours / Math.max(checkpointCount, 1)).toFixed(1)}h/checkpoint |\n\n`;
  
  // Priority distribution
  md += `## 🚦 Distribución por Prioridad\n\n`;
  md += `| Prioridad | Cantidad | Porcentaje |\n`;
  md += `|-----------|----------|------------|\n`;
  md += `| 🔴 Alta | ${stats.byPriority.high} | ${((stats.byPriority.high / stats.total) * 100).toFixed(0)}% |\n`;
  md += `| 🟡 Media | ${stats.byPriority.medium} | ${((stats.byPriority.medium / stats.total) * 100).toFixed(0)}% |\n`;
  md += `| 🟢 Baja | ${stats.byPriority.low} | ${((stats.byPriority.low / stats.total) * 100).toFixed(0)}% |\n\n`;
  
  // Agent workload
  md += `## 👥 Distribución por Agente\n\n`;
  md += `| Agente | Tareas Asignadas | Carga |\n`;
  md += `|--------|------------------|-------|\n`;
  md += `| SOFIA | ${stats.byAgent.SOFIA} | ${progressBar((stats.byAgent.SOFIA / stats.total) * 100, 10)} |\n`;
  md += `| CODEX | ${stats.byAgent.CODEX} | ${progressBar((stats.byAgent.CODEX / stats.total) * 100, 10)} |\n`;
  md += `| GEMINI | ${stats.byAgent.GEMINI} | ${progressBar((stats.byAgent.GEMINI / stats.total) * 100, 10)} |\n`;
  md += `| Sin asignar | ${stats.byAgent.unassigned} | — |\n\n`;
  
  // Documentation metrics
  md += `## 📚 Métricas de Documentación\n\n`;
  md += `| Tipo | Cantidad |\n`;
  md += `|------|----------|\n`;
  md += `| Checkpoints | ${checkpointCount} |\n`;
  md += `| Especificaciones | ${specCount} |\n`;
  md += `| ADRs | ${adrCount} |\n`;
  md += `| Total Docs | ${checkpointCount + specCount + adrCount} |\n\n`;
  
  // Recent activity (top 5 completed tasks)
  const recentCompleted = tasks
    .filter(t => t.status === 'completed')
    .slice(-5)
    .reverse();
  
  if (recentCompleted.length > 0) {
    md += `## ✅ Últimas Tareas Completadas\n\n`;
    recentCompleted.forEach(task => {
      md += `- **[${task.id}]** ${task.name} `;
      if (task.priority) md += `${task.priority} `;
      if (task.assigned) md += `(${task.assigned}) `;
      if (task.estimation) md += `— ${task.estimation.toFixed(1)}h`;
      md += `\n`;
    });
    md += `\n`;
  }
  
  // Current work (in-progress tasks)
  const currentWork = tasks.filter(t => t.status === 'in-progress');
  
  if (currentWork.length > 0) {
    md += `## 🚧 Trabajo Actual\n\n`;
    currentWork.forEach(task => {
      md += `- **[${task.id}]** ${task.name} `;
      if (task.priority) md += `${task.priority} `;
      if (task.assigned) md += `(${task.assigned}) `;
      if (task.estimation) md += `— ${task.estimation.toFixed(1)}h`;
      md += `\n`;
    });
    md += `\n`;
  }
  
  // High priority pending tasks
  const highPriorityPending = tasks
    .filter(t => t.status === 'pending' && t.priority === '🔴')
    .slice(0, 5);
  
  if (highPriorityPending.length > 0) {
    md += `## 🔴 Próximas Tareas de Alta Prioridad\n\n`;
    highPriorityPending.forEach(task => {
      md += `- **[${task.id}]** ${task.name} `;
      if (task.assigned) md += `(${task.assigned}) `;
      if (task.estimation) md += `— ${task.estimation.toFixed(1)}h`;
      md += `\n`;
    });
    md += `\n`;
  }
  
  // Tags cloud
  const allTags = tasks.flatMap(t => t.tags);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});
  
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  if (topTags.length > 0) {
    md += `## 🏷️ Tags Más Comunes\n\n`;
    topTags.forEach(([tag, count]) => {
      md += `- ${tag}: **${count}** tareas\n`;
    });
    md += `\n`;
  }
  
  // Health indicators
  md += `## 💚 Indicadores de Salud del Proyecto\n\n`;
  
  const healthIndicators = [
    {
      name: 'Progreso General',
      value: stats.completionRate,
      threshold: { good: 60, warning: 30 },
      unit: '%'
    },
    {
      name: 'Tareas Bloqueadas',
      value: tasks.filter(t => t.blockers && t.blockers.length > 0).length,
      threshold: { good: 2, warning: 5 },
      inverse: true
    },
    {
      name: 'Tareas Sin Asignar',
      value: stats.byAgent.unassigned,
      threshold: { good: 3, warning: 7 },
      inverse: true
    },
    {
      name: 'Cobertura de Documentación',
      value: Math.min(100, (checkpointCount / Math.max(stats.completed, 1)) * 100),
      threshold: { good: 80, warning: 50 },
      unit: '%'
    }
  ];
  
  md += `| Indicador | Valor | Estado |\n`;
  md += `|-----------|-------|--------|\n`;
  
  healthIndicators.forEach(indicator => {
    let status = '';
    let value = indicator.value;
    
    if (indicator.inverse) {
      status = value <= indicator.threshold.good ? '✅' : 
               value <= indicator.threshold.warning ? '⚠️' : '❌';
    } else {
      status = value >= indicator.threshold.good ? '✅' : 
               value >= indicator.threshold.warning ? '⚠️' : '❌';
    }
    
    const displayValue = indicator.unit === '%' ? value.toFixed(0) : value;
    md += `| ${indicator.name} | ${displayValue}${indicator.unit || ''} | ${status} |\n`;
  });
  
  md += `\n`;
  
  // Footer
  md += `---\n\n`;
  md += `## 📝 Notas\n\n`;
  md += `- Este dashboard se genera automáticamente desde \`PROYECTO.md\`\n`;
  md += `- Para regenerarlo: \`node metodologia-integra/scripts/generate-dashboard.js\`\n`;
  md += `- Para más detalles, consulta \`PROYECTO.md\` y los checkpoints en \`Checkpoints/\`\n\n`;
  md += `**Última generación:** ${dateStr} ${timeStr}\n`;
  
  return md;
}

// Main execution
function main() {
  try {
    log('🚀 Generando dashboard...', 'cyan');
    
    // Read PROYECTO.md
    log('📖 Leyendo PROYECTO.md...', 'blue');
    const proyectoContent = fs.readFileSync(CONFIG.projectFile, 'utf-8');
    
    // Parse tasks
    log('🔍 Parseando tareas...', 'blue');
    const tasks = parseProyecto(proyectoContent);
    log(`   Encontradas ${tasks.length} tareas`, 'green');
    
    // Generate statistics
    log('📊 Generando estadísticas...', 'blue');
    const stats = generateStats(tasks);
    
    // Generate dashboard
    log('✨ Creando dashboard...', 'blue');
    const dashboard = generateDashboard(stats, tasks);
    
    // Write output
    log(`💾 Escribiendo ${CONFIG.outputFile}...`, 'blue');
    fs.writeFileSync(CONFIG.outputFile, dashboard);
    
    log('✅ Dashboard generado exitosamente!', 'green');
    log(`   Archivo: ${CONFIG.outputFile}`, 'green');
    log(`   Tareas: ${stats.completed}/${stats.total} completadas (${stats.completionRate}%)`, 'green');
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for testing
module.exports = { parseProyecto, generateStats, generateDashboard };
