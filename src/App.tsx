import { GoogleGenAI, Type } from '@google/genai';
import { AlignLeft, Copy, FileText, Flag, Share2, Sparkles, Wand2 } from 'lucide-react';
import { useState } from 'react';
import Markdown from 'react-markdown';

const OBJECTIVES = [
  'Entretener',
  'Educar',
  'Informar',
  'Motivar',
  'Vender / Persuadir',
];

export default function App() {
  const [notes, setNotes] = useState('');
  const [objective, setObjective] = useState(OBJECTIVES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ blog: string; social: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedBlog, setCopiedBlog] = useState(false);
  const [copiedSocial, setCopiedSocial] = useState(false);

  const handleGenerate = async () => {
    if (!notes.trim()) {
      setError('Por favor, ingresa tus notas antes de generar el artículo.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
Eres un redactor experto y creador de contenidos. Tu tarea es generar dos versiones de un artículo basado en las notas desordenadas del usuario y el objetivo seleccionado.

Notas del usuario:
"${notes}"

Objetivo del artículo: ${objective}

Instrucciones estrictas:
1. Analiza las notas y entiende el objetivo.
2. Realiza una búsqueda en internet para profundizar en el tema si es necesario (usando la herramienta de búsqueda).
3. Redacta el contenido con un lenguaje amigable y sin usar jerga especializada (para personas comunes).
4. El artículo largo (Blog) DEBE tener esta estructura exacta:
   - Titular (atractivo)
   - Entrada (introducción que enganche)
   - Cuerpo (desarrollo del tema)
   - Conclusión (cierre)
5. El artículo largo DEBE terminar con una pregunta que invite a los lectores a abrir conversaciones y comentarios.
6. El resumen (Redes) debe ser corto, atractivo y diseñado para captar la atención en redes sociales, invitando a leer el artículo completo.

Devuelve la respuesta en formato JSON con la siguiente estructura:
{
  "blog": "El contenido del artículo largo en formato Markdown (usa # para el titular, ## para las secciones)",
  "social": "El contenido del resumen para redes sociales"
}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              blog: {
                type: Type.STRING,
                description: 'El contenido del artículo largo en formato Markdown',
              },
              social: {
                type: Type.STRING,
                description: 'El contenido del resumen para redes sociales',
              },
            },
            required: ['blog', 'social'],
          },
        },
      });

      if (response.text) {
        const parsedResult = JSON.parse(response.text);
        setResult(parsedResult);
      } else {
        setError('No se pudo generar el contenido. Intenta de nuevo.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al generar el contenido.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, type: 'blog' | 'social') => {
    navigator.clipboard.writeText(text);
    if (type === 'blog') {
      setCopiedBlog(true);
      setTimeout(() => setCopiedBlog(false), 2000);
    } else {
      setCopiedSocial(true);
      setTimeout(() => setCopiedSocial(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-1/3 lg:w-1/4 p-6 md:p-8 border-b md:border-b-0 md:border-r border-black flex flex-col gap-8 md:h-screen md:sticky md:top-0 overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-full">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Genera</h1>
          <span className="ml-auto text-xs font-medium border border-black px-2 py-1 rounded-full">v1.0 Accesible</span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <AlignLeft className="w-5 h-5" />
            <h2 className="text-xl font-bold">Tus Notas</h2>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Escribe aquí tus ideas desordenadas..."
            className="w-full h-48 p-4 border-2 border-black rounded-2xl resize-none focus:outline-none focus:ring-4 focus:ring-black/10 text-lg transition-all"
            aria-label="Tus notas"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            <h2 className="text-xl font-bold">Objetivo</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {OBJECTIVES.map((obj) => (
              <button
                key={obj}
                onClick={() => setObjective(obj)}
                className={`p-3 border-2 border-black rounded-full text-base font-semibold transition-all flex items-center justify-center gap-2 min-h-[48px] ${
                  objective === obj
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-black/5'
                }`}
                aria-pressed={objective === obj}
              >
                <div className={`w-4 h-4 rounded-full border-2 border-current flex items-center justify-center ${objective === obj ? 'bg-white' : 'bg-transparent'}`}>
                  {objective === obj && <div className="w-2 h-2 bg-black rounded-full" />}
                </div>
                {obj}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 w-full bg-black text-white p-4 rounded-full text-lg font-bold flex items-center justify-center gap-3 hover:bg-black/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[60px]"
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Wand2 className="w-6 h-6" />
              GENERAR ARTÍCULO
            </>
          )}
        </button>

        {error && (
          <div className="p-4 border-2 border-black bg-black/5 rounded-2xl text-black font-medium">
            {error}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 lg:p-16 bg-white overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-black tracking-tight mb-4">Resultados</h2>
            <p className="text-lg text-black/70 font-medium">Tu contenido listo para usar.</p>
          </div>

          {result ? (
            <div className="flex flex-col gap-12">
              {/* Blog Card */}
              <div className="border-2 border-black rounded-3xl p-8 md:p-12 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3 mb-8 border-b-2 border-black pb-6">
                  <FileText className="w-8 h-8" />
                  <h3 className="text-2xl font-bold">Artículo Largo (Blog)</h3>
                </div>
                
                <div className="prose prose-lg prose-black max-w-none mb-12 prose-headings:font-black prose-p:text-lg prose-p:leading-relaxed prose-a:text-black prose-a:underline prose-a:font-bold">
                  <Markdown>{result.blog}</Markdown>
                </div>

                <button
                  onClick={() => handleCopy(result.blog, 'blog')}
                  className="w-full border-2 border-black p-4 rounded-full text-lg font-bold flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-all min-h-[60px]"
                >
                  <Copy className="w-6 h-6" />
                  {copiedBlog ? '¡COPIADO!' : 'COPIAR BLOG'}
                </button>
              </div>

              {/* Social Card */}
              <div className="border-2 border-black rounded-3xl p-8 md:p-12 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3 mb-8 border-b-2 border-black pb-6">
                  <Share2 className="w-8 h-8" />
                  <h3 className="text-2xl font-bold">Resumen (Redes)</h3>
                </div>
                
                <div className="text-xl leading-relaxed font-medium mb-12 p-6 bg-black/5 rounded-2xl border-2 border-black/10">
                  {result.social}
                </div>

                <button
                  onClick={() => handleCopy(result.social, 'social')}
                  className="w-full border-2 border-black p-4 rounded-full text-lg font-bold flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-all min-h-[60px]"
                >
                  <Copy className="w-6 h-6" />
                  {copiedSocial ? '¡COPIADO!' : 'COPIAR RESUMEN'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-black/30 rounded-3xl text-black/50">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-xl font-medium text-center max-w-md">
                Ingresa tus notas y selecciona un objetivo para generar tu contenido.
              </p>
            </div>
          )}
        </div>
        
        <footer className="mt-24 text-center text-sm font-medium text-black/50 border-t-2 border-black/10 pt-8">
          Diseñado con enfoque en accesibilidad y claridad visual.
        </footer>
      </main>
    </div>
  );
}
