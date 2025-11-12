export function calcularMatchScore(
  respuestas: { 
    respuestaTexto: string; 
    pregunta: { texto: string; tipo: string; opciones?: string | null }; // 👈 aquí
  }[],
  competencias: Record<string, any>
) {
  let score = 0;
  const detalle: Record<string, any> = {};

  for (const r of respuestas) {
    const key = r.pregunta.texto;
    const esperada = competencias[key];
    let parcial = 0;

    if (r.pregunta.tipo === 'multiple_choice' || r.pregunta.tipo === 'checkbox') {
      if (r.respuestaTexto === esperada) {
        parcial = 1;
      }
    } else if (r.pregunta.tipo === 'open_text') {
      parcial = r.respuestaTexto.includes(esperada) ? 0.5 : 0;
    }

    detalle[key] = parcial;
    score += parcial;
  }

  return { score, detalle };
}
