import React, { useEffect, useRef } from 'react';

function AdPlaceholder({
    client = "ca-pub-3520411621823759", // Tu ID publicador
    slot, // ID del bloque de anuncio específico
    format = "auto",
    responsive = "true",
    className = "", // Clases adicionales para el contenedor principal
    style = {} // Estilos inline adicionales para el contenedor principal
}) {
    const adContainerRef = useRef(null); // Referencia al div contenedor
    const adPushed = useRef(false); // Para controlar si ya se hizo push

    useEffect(() => {
        // Ejecutar solo si hay slot, el contenedor existe y no se ha hecho push antes
        if (slot && adContainerRef.current && !adPushed.current) {
            // Intentar push después de un breve retraso
            const timer = setTimeout(() => {
                if (!adContainerRef.current) return; // Doble check por si se desmontó

                try {
                    console.log(`AdSense: Attempting push for slot ${slot}`);
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                    adPushed.current = true; // Marcar como hecho
                    console.log(`AdSense: Push potentially successful for slot ${slot}`);
                } catch (e) {
                    // Capturar errores comunes de AdSense
                    console.error(`AdSense Error pushing ad for slot ${slot}:`, e);
                }
            }, 100); // Aumentar un poco el retraso a 100ms

            return () => clearTimeout(timer); // Limpiar timer al desmontar
        }
    // Ejecutar solo cuando el slot cambie (o al montar)
    }, [slot]);

    // Mensaje de error si falta el slot ID
    if (!slot) {
        return (
            <div
                className={`rounded-lg bg-red-900/50 border border-red-700 flex items-center justify-center text-red-300 text-xs italic shadow-inner h-16 w-full ${className}`}
                style={style}
            >
                Error: Falta ID de Ad Slot.
            </div>
        );
    }

    // Renderizar contenedor y etiqueta <ins>
    return (
        <div
            ref={adContainerRef} // Asignar ref
            // Asegurar visibilidad y tamaño mínimo
            className={`ad-container overflow-hidden relative ${className}`}
            style={{ display: 'block', minWidth: '50px', minHeight: '50px', ...style }}
        >
             {/* Placeholder visual sutil */}
             <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs italic pointer-events-none -z-10 opacity-50">
                 (Ad Slot: {slot})
             </div>
            <ins
                className="adsbygoogle"
                style={{ display: 'block', width: '100%', height: '100%' }} // Ocupar contenedor
                data-ad-client={client}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
                key={slot} // Forzar re-render si cambia el slot
                >
            </ins>
        </div>
    );
}

export default AdPlaceholder;
