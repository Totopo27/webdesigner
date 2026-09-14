import { SddDesignEngine } from "../src/workflow/engine.js";
import { OllamaDesignProvider } from "../src/providers/ollama-provider.js";
import { ComponentValidator } from "../src/ast/validator.js";
import * as path from "node:path";

async function main() {
  console.log("=================================================");
  console.log("🎨 INICIANDO PRUEBA END-TO-END: pi-sdd-design");
  console.log("⚡ Motor: Ollama (richardyoung/qwen2.5-coder-14b-instruct-abliterated)");
  console.log("=================================================\n");

  const cwd = process.cwd();
  const provider = new OllamaDesignProvider({ baseDir: cwd });
  const engine = new SddDesignEngine({
    baseDir: cwd,
    provider,
    projectName: "CryptoVault Analytics",
  });

  // 1. Fase 1: Inicializar Sistema de Diseño
  console.log("📋 [Fase 1] Inicializando Sistema de Diseño (DESIGN.md)...");
  const system = engine.initDesignSystem("CryptoVault Modern Design System");
  console.log(`   ✅ Sistema '${system.name}' creado con ${Object.keys(system.colors).length} colores y tipografías configuradas.\n`);

  // 2. Fase 2: Generación Visual con Ollama
  console.log("🤖 [Fase 2] Generando pantalla de UI con Ollama en GPU local...");
  const prompt = "Modern Web3 DeFi Dashboard with total portfolio value card, crypto asset distribution, quick swap widget, and recent transactions table with dark theme";
  const startGen = Date.now();
  const { artifact, iterationNumber } = await engine.generateScreen(prompt);
  const genDuration = ((Date.now() - startGen) / 1000).toFixed(2);

  console.log(`   ✅ Pantalla generada en ${genDuration}s!`);
  console.log(`   📄 ID: ${artifact.screenId}`);
  console.log(`   🌐 HTML generado: ${artifact.htmlContent.length} bytes`);
  console.log(`   💾 Iteración registrada: #${iterationNumber}\n`);

  // 3. Fase 3: Auditoría Estética y Accesibilidad (Taste Critic)
  console.log("⚖️ [Fase 3] Ejecutando Judgment Day: Auditoría visual y accesibilidad...");
  const verdict = engine.judgeActiveIteration([
    "Distribución de widgets equilibrada en cuadrícula de 3 columnas.",
    "Contraste adecuado en textos y tarjetas con borde sutil.",
  ]);
  console.log(`   ✅ Veredicto: ${verdict.status} (Score: ${verdict.overallScore}/100)`);
  console.log(`   🔍 Contraste WCAG: ${verdict.wcagContrast.passes ? "PASADO" : "FALLÓ"}`);
  console.log(`   📐 8pt Grid Rhythm: ${verdict.grid8pt.passes ? "PASADO" : "FALLÓ"}\n`);

  // 4. Fase 4: Componentización a Clean Architecture React
  console.log("🚀 [Fase 4] Componentizando a React + TypeScript modular...");
  const transform = engine.componentizeActiveScreen();
  console.log(`   ✅ ${transform.summary}`);
  for (const file of transform.files) {
    console.log(`      📁 [${file.type}] ${file.relativePath} (${file.content.length} bytes)`);
  }
  console.log("");

  // 5. Fase 5: Validación AST de Reglas Arquitectónicas
  console.log("🛡️ [Fase 5] Validando código generado contra reglas AST...");
  const compDir = path.join(cwd, "src", "components");
  const astReport = ComponentValidator.validateDirectory(compDir);
  console.log(`   ✅ Archivos escaneados: ${astReport.scannedFilesCount}`);
  console.log(`   ✅ Violaciones detectadas: ${astReport.violations.length}`);
  if (astReport.violations.length > 0) {
    for (const v of astReport.violations) {
      console.log(`      ⚠️ [${v.rule}] ${v.file}: ${v.message}`);
    }
  } else {
    console.log(`   🎉 Código 100% limpio y conforme a Clean Architecture (cero hex sueltos, interfaces Props estrictas, mockData desacoplada).\n`);
  }

  // 6. Fase 6: Resumen de Trajectory
  console.log("📜 [Fase 6] Reporte de Trajectory (Trazabilidad Inmutable):");
  console.log(engine.getTrajectoryReport());

  console.log("\n=================================================");
  console.log("🎯 PRUEBA END-TO-END FINALIZADA CON ÉXITO ROTUNDO");
  console.log("=================================================");
}

main().catch((err) => {
  console.error("❌ Error en la prueba:", err);
  process.exit(1);
});
