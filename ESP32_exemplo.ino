/*
  EXEMPLO DE CÓDIGO PARA ESP32 ENVIAR MEDIÇÕES AO BACKEND
  
  Este é um exemplo completo de como configurar um ESP32 para:
  1. Conectar-se ao WiFi
  2. Ler dados de sensores (temperatura e umidade)
  3. Enviar os dados ao backend do Warehouse Monitor
*/

// ===== IGNORE ESSE ARQUIVO POR ENQUANTO =====

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ===== CONFIGURAÇÃO WiFi =====
const char* ssid = "seu_wifi_ssid";
const char* password = "sua_senha_wifi";

// ===== CONFIGURAÇÃO DO BACKEND =====
const char* serverUrl = "http://seu_ip_backend:3000/medicao";  // URL do backend
const char* deviceId = "30:AE:A4:2A:C4:80";  // MAC address ou ID único do ESP
const char* environmentId = "seu_ambiente_id";  // ID do ambiente cadastrado no banco

// ===== CONFIGURAÇÃO DO SENSOR DHT22 =====
#define DHTPIN 4        // Pino onde o DHT22 está conectado
#define DHTTYPE DHT22   // Tipo de sensor
DHT dht(DHTPIN, DHTTYPE);

// ===== CONFIGURAÇÃO DE TIMING =====
unsigned long lastSendTime = 0;
const long sendInterval = 30000;  // Enviar a cada 30 segundos (em ms)

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\nIniciando ESP32...");
  
  // Inicializar sensor DHT
  dht.begin();
  
  // Conectar ao WiFi
  connectToWiFi();
}

void loop() {
  // Verificar conexão WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado! Reconectando...");
    connectToWiFi();
  }
  
  // Enviar dados periodicamente
  if (millis() - lastSendTime >= sendInterval) {
    lastSendTime = millis();
    sendSensorData();
  }
}

// Função para conectar ao WiFi
void connectToWiFi() {
  Serial.print("Conectando ao WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFalha ao conectar WiFi!");
  }
}

// Função para ler e enviar dados dos sensores
void sendSensorData() {
  // Ler dados do sensor
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  
  // Verificar se a leitura foi bem-sucedida
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Erro ao ler sensor DHT!");
    return;
  }
  
  Serial.print("Temperatura: ");
  Serial.print(temperature);
  Serial.print(" °C | Umidade: ");
  Serial.print(humidity);
  Serial.println(" %");
  
  // Enviar temperatura
  sendMeasurement(temperature, "temperatura");
  
  // Enviar umidade
  sendMeasurement(humidity, "umidade");
}

// Função para enviar uma medição ao backend
void sendMeasurement(float value, String type) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado!");
    return;
  }
  
  HTTPClient http;
  
  // Criar JSON com os dados
  DynamicJsonDocument doc(200);
  doc["dispositivoId"] = deviceId;
  doc["ambienteId"] = environmentId;
  doc["tipo"] = type;
  doc["valor"] = value;
  
  // Serializar para string
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("Enviando ");
  Serial.print(type);
  Serial.print(": ");
  Serial.println(jsonString);
  
  // Fazer POST request
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Resposta: ");
    Serial.println(httpResponseCode);
    Serial.println(response);
  } else {
    Serial.print("Erro na requisição: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

/*
  ===== INSTRUÇÕES DE CONFIGURAÇÃO =====
  
  1. Instalar bibliotecas no Arduino IDE:
     - ArduinoJson (para JSON)
     - DHT sensor library
  
  2. Alterar as constantes acima:
     - ssid: Nome da sua rede WiFi
     - password: Senha do WiFi
     - serverUrl: IP e porta do seu backend
     - deviceId: MAC address do ESP32 (encontrado em: Serial Monitor após conectar ao WiFi)
     - environmentId: ID do ambiente cadastrado no banco (obter via API /ambiente)
  
  3. Conectar o sensor DHT22:
     - VCC → 3.3V
     - GND → GND
     - DATA → GPIO 4 (ou outro pino, conforme DHTPIN)
  
  4. Upload do código e monitorar via Serial Monitor (115200 baud)
  
  ===== RESPOSTA ESPERADA =====
  
  Sucesso (201):
  {
    "success": true,
    "message": "Medição recebida com sucesso",
    "data": {
      "id": "uuid-gerado",
      "dispositivoId": "30:AE:A4:2A:C4:80",
      "ambienteId": "id-ambiente",
      "tipo": "temperatura",
      "valor": 25.5,
      "createdAt": "2026-01-28T15:37:57.256Z"
    }
  }
  
  Erro (400):
  {
    "success": false,
    "message": "Descrição do erro"
  }
*/
