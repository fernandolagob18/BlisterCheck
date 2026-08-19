import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para suscribirse a los cambios en tiempo real de las clasificaciones.
 * @param {Array} cns - Array de Códigos Nacionales actualmente en pantalla.
 * @param {Map} clasificacionMap - El estado local actual del mapa de clasificaciones.
 * @param {Function} setClasificacionMap - Función para actualizar el estado.
 */
export function useRealtimeClasificaciones(cns, clasificacionMap, setClasificacionMap) {
  const { user } = useAuth();

  useEffect(() => {
    // Solo nos suscribimos si hay items en pantalla y hay red
    if (!cns || cns.length === 0) return;

    // Canal para cambios GLOBALES (SDMDU, reenvasado, etc.)
    const globalChannel = supabase.channel('global-clasificaciones-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'blistercheck_clasificacion_global'
        },
        (payload) => {
          const changedData = payload.new;
          if (!changedData || !changedData.cn) return;

          // Si el medicamento cambiado está en nuestra pantalla, actualizamos el mapa
          if (cns.includes(changedData.cn)) {
            setClasificacionMap(prevMap => {
              const newMap = new Map(prevMap);
              const current = newMap.get(changedData.cn) || {};
              newMap.set(changedData.cn, {
                ...current,
                cn: changedData.cn,
                requiere_reenvasado: changedData.requiere_reenvasado ?? null,
                requiere_reetiquetado: changedData.requiere_reetiquetado ?? null,
                apto_sdmdu_blister: changedData.apto_sdmdu_blister ?? null,
                solo_envase_clinico: changedData.solo_envase_clinico ?? false,
                updated_at: changedData.updated_at || current.updated_at
              });
              return newMap;
            });
          }
        }
      )
      .subscribe();

    // Canal para cambios PRIVADOS (En mi farmacia, notas)
    let userChannel = null;
    if (user) {
      userChannel = supabase.channel('user-farmacia-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blistercheck_user_farmacia',
            filter: `user_id=eq.${user.id}` // Importante: solo mis propios cambios de pestaña a pestaña
          },
          (payload) => {
            const changedData = payload.new;
            if (!changedData || !changedData.cn) return;

            if (cns.includes(changedData.cn)) {
              setClasificacionMap(prevMap => {
                const newMap = new Map(prevMap);
                const current = newMap.get(changedData.cn) || {};
                newMap.set(changedData.cn, {
                  ...current,
                  cn: changedData.cn,
                  en_mi_farmacia: changedData.en_mi_farmacia ?? false,
                  notas: changedData.notas ?? '',
                  updated_at: changedData.updated_at || current.updated_at
                });
                return newMap;
              });
            }
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(globalChannel);
      if (userChannel) supabase.removeChannel(userChannel);
    };
  }, [cns, setClasificacionMap, user]);
}
