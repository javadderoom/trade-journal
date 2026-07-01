//+------------------------------------------------------------------+
//| TradeKav_EA.mq4                                                  |
//| TradeKav — Trade History Sync Expert Advisor for MT4             |
//| Sends open + closed trades to API via WebRequest                 |
//+------------------------------------------------------------------+
#property copyright "TradeKav"
#property link      "https://tradekav.ir"
#property version   "1.00"
#property strict

//--- Input parameters
input string   InpApiUrl       = "https://api.tradekav.ir";  // API Base URL
input string   InpApiToken     = "";                       // API Auth Token
input int      InpAccountId    = 1;                        // Account ID
input int      InpSyncInterval = 60;                       // Sync interval (seconds, 0 = manual)
input int      InpLookbackDays = 365;                      // Days back for first sync

//--- Globals
datetime g_lastSyncTime = 0;
int      g_lastTicket   = 0;
string   g_authHeader   = "";

//+------------------------------------------------------------------+
//| Expert initialization                                             |
//+------------------------------------------------------------------+
int OnInit()
{
   if (StringLen(InpApiToken) > 0)
      g_authHeader = "Authorization: Bearer " + InpApiToken;

   // Load last synced ticket from global variable
   string gvName = "TradeKav_LastTicket_" + IntegerToString(InpAccountId);
   if (GlobalVariableCheck(gvName))
      g_lastTicket = (int)GlobalVariableGet(gvName);

   if (InpSyncInterval > 0)
      EventSetTimer(InpSyncInterval);

   // Initial sync
   SyncOpenPositions();
   SyncClosedTrades();

   Print("TradeKav EA initialized. Last ticket: ", g_lastTicket);

   // Draw manual sync button
   CreateSyncButton();

   return (INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                           |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   ObjectDelete(0, "btnSyncNow");
}

//+------------------------------------------------------------------+
//| Timer — periodic sync                                             |
//+------------------------------------------------------------------+
void OnTimer()
{
   SyncOpenPositions();
   SyncClosedTrades();
}

//+------------------------------------------------------------------+
//| Chart event — manual sync button                                  |
//+------------------------------------------------------------------+
void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
{
   if (id == CHARTEVENT_OBJECT_CLICK && sparam == "btnSyncNow")
   {
      Print("Manual sync triggered...");
      SyncOpenPositions();
      SyncClosedTrades();
      ObjectSetInteger(0, "btnSyncNow", OBJPROP_STATE, false);
   }
}

//+------------------------------------------------------------------+
//| Create the manual sync button on chart                            |
//+------------------------------------------------------------------+
void CreateSyncButton()
{
   ObjectCreate(0, "btnSyncNow", OBJ_BUTTON, 0, 0, 0);
   ObjectSetInteger(0, "btnSyncNow", OBJPROP_XDISTANCE, 10);
   ObjectSetInteger(0, "btnSyncNow", OBJPROP_YDISTANCE, 30);
   ObjectSetInteger(0, "btnSyncNow", OBJPROP_XSIZE, 120);
   ObjectSetInteger(0, "btnSyncNow", OBJPROP_YSIZE, 30);
   ObjectSetInteger(0, "btnSyncNow", OBJPROP_CORNER, CORNER_RIGHT_UPPER);
   ObjectSetString(0, "btnSyncNow", OBJPROP_TEXT, "Sync Now");
   ObjectSetInteger(0, "btnSyncNow", OBJPROP_COLOR, clrWhite);
   ObjectSetInteger(0, "btnSyncNow", OBJPROP_BGCOLOR, clrDarkGreen);
   ObjectSetInteger(0, "btnSyncNow", OBJPROP_FONTSIZE, 10);
   ObjectSetInteger(0, "btnSyncNow", OBJPROP_HIDDEN, false);
}

//+------------------------------------------------------------------+
//| Sync open (active) positions                                      |
//+------------------------------------------------------------------+
void SyncOpenPositions()
{
   int total = OrdersTotal();
   if (total == 0) return;

   string jsonPayload = "[";
   int count = 0;
   int timezoneOffset = (int)(TimeCurrent() - TimeGMT());

   for (int i = 0; i < total; i++)
   {
      if (!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;

      int    ticket    = (int)OrderTicket();
      string symbol   = OrderSymbol();
      int    type     = (int)OrderType();

      // Only BUY / SELL positions
      if (type != OP_BUY && type != OP_SELL) continue;

      string direction = (type == OP_BUY) ? "BUY" : "SELL";
      double openPrice = OrderOpenPrice();
      double volume    = OrderLots();
      double sl        = OrderStopLoss();
      double tp        = OrderTakeProfit();
      double profit    = OrderProfit();
      double swap      = OrderSwap();
      double commission = OrderCommission();
      datetime openTime = OrderOpenTime();
      double curPrice  = (direction == "BUY") ? MarketInfo(symbol, MODE_ASK) : MarketInfo(symbol, MODE_BID);

      datetime utcOpenTime = openTime - timezoneOffset;

      int digits = (int)MarketInfo(symbol, MODE_DIGITS);

      // Calculate live pips
      double pipSize = MathPow(10, -digits);
      if (digits == 3 || digits == 5)
         pipSize *= 10;

      double pips = 0;
      if (openPrice > 0 && curPrice > 0)
      {
         if (direction == "BUY")
            pips = (curPrice - openPrice) / pipSize;
         else
            pips = (openPrice - curPrice) / pipSize;
      }

      // R-multiple
      double entryRisk = MathAbs(openPrice - sl);
      double rMultiple = 0;
      if (entryRisk > 0)
         rMultiple = (profit + commission + swap) / (entryRisk / 0.0001); // approximate

      if (count > 0) jsonPayload += ",";

      jsonPayload += "{";
      jsonPayload += "\"ticket\":" + IntegerToString(ticket) + ",";
      jsonPayload += "\"symbol\":\"" + symbol + "\",";
      jsonPayload += "\"direction\":\"" + direction + "\",";
      jsonPayload += "\"openTime\":\"" + FormatDateTime(utcOpenTime) + "\",";
      jsonPayload += "\"closeTime\":null,";
      jsonPayload += "\"openPrice\":" + DoubleToString(openPrice, digits) + ",";
      jsonPayload += "\"closePrice\":null,";
      jsonPayload += "\"lotSize\":" + DoubleToString(volume, 2) + ",";
      jsonPayload += "\"stopLoss\":" + DoubleToString(sl, digits) + ",";
      jsonPayload += "\"takeProfit\":" + DoubleToString(tp, digits) + ",";
      jsonPayload += "\"profitUsd\":" + DoubleToString(profit, 2) + ",";
      jsonPayload += "\"commission\":" + DoubleToString(commission, 2) + ",";
      jsonPayload += "\"swap\":" + DoubleToString(swap, 2) + ",";
      jsonPayload += "\"pips\":" + DoubleToString(pips, 1) + ",";
      jsonPayload += "\"rMultiple\":" + DoubleToString(rMultiple, 2) + ",";
      jsonPayload += "\"chartData\":" + GetChartDataJson(symbol, openTime, 0, timezoneOffset);
      jsonPayload += "}";

      count++;
   }

   jsonPayload += "]";

   if (count == 0) return;

   if (SendToApi(jsonPayload))
      Print("Synced ", count, " open position(s).");
}

//+------------------------------------------------------------------+
//| Sync closed trades from order history                             |
//+------------------------------------------------------------------+
void SyncClosedTrades()
{
   datetime fromDate;
   if (g_lastTicket == 0)
      fromDate = TimeCurrent() - InpLookbackDays * 86400;
   else
      fromDate = g_lastSyncTime > 0 ? g_lastSyncTime - 86400 : TimeCurrent() - 86400;

   if (!HistorySelect(fromDate, TimeCurrent()))
   {
      Print("Failed to select trade history");
      return;
   }

   int total = OrdersHistoryTotal();
   if (total == 0) return;

   string jsonPayload = "[";
   int newTrades = 0;
   int maxTicket = g_lastTicket;
   int timezoneOffset = (int)(TimeCurrent() - TimeGMT());

   for (int i = 0; i < total; i++)
   {
      if (!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;

      int ticket = (int)OrderTicket();

      // Skip already synced
      if (ticket <= g_lastTicket) continue;

      int type = (int)OrderType();
      if (type != OP_BUY && type != OP_SELL) continue;

      string symbol    = OrderSymbol();
      string direction = (type == OP_BUY) ? "BUY" : "SELL";
      double openPrice = OrderOpenPrice();
      double closePrice = OrderClosePrice();
      double volume    = OrderLots();
      double sl        = OrderStopLoss();
      double tp        = OrderTakeProfit();
      double profit    = OrderProfit();
      double commission = OrderCommission();
      double swap      = OrderSwap();
      datetime openTime = OrderOpenTime();
      datetime closeTime = OrderCloseTime();

      datetime utcOpenTime = openTime - timezoneOffset;
      datetime utcCloseTime = closeTime - timezoneOffset;

      int digits = (int)MarketInfo(symbol, MODE_DIGITS);

      // Pips
      double pipSize = MathPow(10, -digits);
      if (digits == 3 || digits == 5)
         pipSize *= 10;

      double pips = 0;
      if (openPrice > 0 && closePrice > 0)
      {
         if (direction == "BUY")
            pips = (closePrice - openPrice) / pipSize;
         else
            pips = (openPrice - closePrice) / pipSize;
      }

      // R-multiple
      double entryRisk = MathAbs(openPrice - sl);
      double rMultiple = 0;
      if (entryRisk > 0)
         rMultiple = (profit + commission + swap) / (entryRisk / 0.0001);

      if (newTrades > 0) jsonPayload += ",";

      jsonPayload += "{";
      jsonPayload += "\"ticket\":" + IntegerToString(ticket) + ",";
      jsonPayload += "\"symbol\":\"" + symbol + "\",";
      jsonPayload += "\"direction\":\"" + direction + "\",";
      jsonPayload += "\"openTime\":\"" + FormatDateTime(utcOpenTime) + "\",";
      jsonPayload += "\"closeTime\":\"" + FormatDateTime(utcCloseTime) + "\",";
      jsonPayload += "\"openPrice\":" + DoubleToString(openPrice, digits) + ",";
      jsonPayload += "\"closePrice\":" + DoubleToString(closePrice, digits) + ",";
      jsonPayload += "\"lotSize\":" + DoubleToString(volume, 2) + ",";
      jsonPayload += "\"stopLoss\":" + DoubleToString(sl, digits) + ",";
      jsonPayload += "\"takeProfit\":" + DoubleToString(tp, digits) + ",";
      jsonPayload += "\"profitUsd\":" + DoubleToString(profit, 2) + ",";
      jsonPayload += "\"commission\":" + DoubleToString(commission, 2) + ",";
      jsonPayload += "\"swap\":" + DoubleToString(swap, 2) + ",";
      jsonPayload += "\"pips\":" + DoubleToString(pips, 1) + ",";
      jsonPayload += "\"rMultiple\":" + DoubleToString(rMultiple, 2) + ",";
      jsonPayload += "\"chartData\":" + GetChartDataJson(symbol, openTime, closeTime, timezoneOffset);
      jsonPayload += "}";

      newTrades++;
      if (ticket > maxTicket)
         maxTicket = ticket;
   }

   jsonPayload += "]";

   if (newTrades == 0) return;

   if (SendToApi(jsonPayload))
   {
      g_lastTicket = maxTicket;
      g_lastSyncTime = TimeCurrent();
      string gvName = "TradeKav_LastTicket_" + IntegerToString(InpAccountId);
      GlobalVariableSet(gvName, g_lastTicket);

      Print("Synced ", newTrades, " closed trade(s). Last ticket: ", g_lastTicket);
   }
}

//+------------------------------------------------------------------+
//| Send JSON payload to API via WebRequest                           |
//+------------------------------------------------------------------+
bool SendToApi(string jsonPayload)
{
   string url = InpApiUrl + "/api/trades/sync";
   string headers = "Content-Type: application/json\r\n";
   if (StringLen(g_authHeader) > 0)
      headers += g_authHeader + "\r\n";

   uchar postData[];
   StringToCharArray(jsonPayload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(postData, ArraySize(postData) - 1);

   uchar result[];
   string resultHeaders;

   int response = WebRequest("POST", url, headers, 5000, postData, result, resultHeaders);

   if (response == 200 || response == 201)
   {
      if (InpSyncInterval > 0)
         EventSetTimer(InpSyncInterval);
      return true;
   }
   else if (response == 429)
   {
      Print("Rate limit reached (429). Setting sync interval to 1 hour.");
      EventSetTimer(3600);
   }
   else if (response == -1)
   {
      Print("WebRequest failed. Error: ", GetLastError(),
            ". Make sure API URL is added to Tools -> Options -> Expert Advisors -> Allowed URLs");
   }
   else
   {
      string responseBody = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
      Print("Failed to send data: ", response, " - ", responseBody);
   }
   return false;
}

//+------------------------------------------------------------------+
//| Format datetime to ISO 8601                                       |
//+------------------------------------------------------------------+
string FormatDateTime(datetime dt)
{
   MqlDateTime mqlTime;
   TimeToStruct(dt, mqlTime);

   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
      mqlTime.year, mqlTime.mon, mqlTime.day,
      mqlTime.hour, mqlTime.min, mqlTime.sec);
}

//+------------------------------------------------------------------+
//| Get OHLC chart data around the trade as JSON array                |
//+------------------------------------------------------------------+
string GetChartDataJson(string symbol, datetime openTime, datetime closeTime, int timezoneOffset)
{
   if (openTime == 0) return "null";

   datetime curTime = TimeCurrent();
   datetime end = (closeTime == 0) ? curTime : closeTime;

   // Determine appropriate timeframe based on trade duration
   ENUM_TIMEFRAMES timeframe = PERIOD_M1;
   long duration = (long)(end - openTime);

   if (duration > 15 * 24 * 3600) timeframe = PERIOD_D1;
   else if (duration > 4 * 24 * 3600) timeframe = PERIOD_H4;
   else if (duration > 24 * 3600) timeframe = PERIOD_H1;
   else if (duration > 8 * 3600) timeframe = PERIOD_M15;
   else if (duration > 1.5 * 3600) timeframe = PERIOD_M5;

   int periodSec = PeriodSeconds(timeframe);
   datetime startSearch = openTime - 15 * periodSec;
   datetime endSearch = end + 15 * periodSec;
   if (endSearch > curTime) endSearch = curTime;

   MqlRates rates[];
   int copied = CopyRates(symbol, timeframe, startSearch, endSearch, rates);
   if (copied <= 0) return "null";

   // Limit to max 120 bars, center around the trade
   int startIdx = 0;
   int endIdx = copied - 1;
   if (copied > 120)
   {
      int openIdx = 0;
      for (int i = 0; i < copied; i++)
      {
         if (rates[i].time >= openTime)
         {
            openIdx = i;
            break;
         }
      }

      startIdx = openIdx - 20;
      if (startIdx < 0) startIdx = 0;
      endIdx = startIdx + 119;
      if (endIdx >= copied)
      {
         endIdx = copied - 1;
         startIdx = endIdx - 119;
         if (startIdx < 0) startIdx = 0;
      }
   }

   int digits = (int)MarketInfo(symbol, MODE_DIGITS);

   string json = "[";
   int barCount = 0;
   for (int i = startIdx; i <= endIdx; i++)
   {
      if (barCount > 0) json += ",";

      long utcBarTime = (long)rates[i].time - timezoneOffset;

      json += "{";
      json += "\"time\":" + IntegerToString(utcBarTime) + ",";
      json += "\"open\":" + DoubleToString(rates[i].open, digits) + ",";
      json += "\"high\":" + DoubleToString(rates[i].high, digits) + ",";
      json += "\"low\":" + DoubleToString(rates[i].low, digits) + ",";
      json += "\"close\":" + DoubleToString(rates[i].close, digits);
      json += "}";
      barCount++;
   }
   json += "]";

   return json;
}
//+------------------------------------------------------------------+
