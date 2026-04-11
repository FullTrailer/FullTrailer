# Eventos de Samsara configurados en FullTrailer

## Alert Webhooks (v1.0) — configurar en Samsara Dashboard > Settings > Webhooks

| alertConditionId | Descripción | Acción del agente |
|---|---|---|
| VehicleStopped / DeviceStoppedMoving | Camión detenido | Alerta a monitorista |
| DeviceLocationInsideGeofence | Entró a geocerca | Alerta a monitorista |
| DeviceLocationOutsideGeofence | Salió de geocerca | Alerta a monitorista |
| RouteStopEarlyLateArrival | Llegó tarde/temprano | Alerta a operador + monitorista |
| RouteStopEtaUpdated | ETA actualizado | Alerta a monitorista |
| EngineOn | Motor encendido | Marcar chofer como activo |

## Event Subscriptions (v2.0) — registrar via API

- DocumentSubmitted — para recepción de documentos de RR.HH. (fase 2)
- DriverUpdated — sincronizar datos de choferes

## Configuración del webhook en Samsara

1. Ir a cloud.samsara.com > Settings > Webhooks
2. Click "Add Webhook"
3. URL: https://tu-dominio.com/webhook/samsara (HTTPS obligatorio)
4. Copiar el Secret Key (Base64) y ponerlo en .env como SAMSARA_WEBHOOK_SECRET
5. Para desarrollo local: usar ngrok (ngrok http 3000)
