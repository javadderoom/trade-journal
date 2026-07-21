//+------------------------------------------------------------------+
//|                                    TradeKav_EA.mq5               |
//|            معامله‌یار — Trade History Sync Expert Advisor          |
//|              Sends open + closed trades to API via HTTP           |
//+------------------------------------------------------------------+
#property copyright "Mo'amele-yar"
#property link      ""
#property version   "1.11"
#property strict

//--- Input parameters (configure in MT5 Properties -> Inputs)
input string   InpApiUrl       = "https://api.tradekav.ir";  // API Base URL
input string   InpApiToken     = "";                       // API Auth Token (leave empty if no auth)
input int      InpAccountId    = 1;                        // Account ID
input int      InpSyncInterval = 60;                       // Sync interval in seconds (0 = manual only)
input int      InpLookbackDays = 365;                      // How many days back to sync on first run

//--- Global variables
datetime g_lastSyncTime = 0;
int      g_lastTicket   = 0;
string   g_authHeader   = "";

//+------------------------------------------------------------------+
//| Expert initialization function                                     |
//+------------------------------------------------------------------+
int OnInit()
{
   if(StringLen(InpApiToken) > 0)
      g_authHeader = "Authorization: Bearer " + InpApiToken;

   string gvName = "TradeKav_LastTicket_" + IntegerToString(InpAccountId);
   if(GlobalVariableCheck(gvName))
      g_lastTicket = (int)GlobalVariableGet(gvName);

   if(InpSyncInterval > 0)
      EventSetTimer(InpSyncInterval);

   SyncAll();

   Print("TradeKav EA initialized. Last ticket: ", g_lastTicket);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                   |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
}

//+------------------------------------------------------------------+
//| Timer function                                                     |
//+------------------------------------------------------------------+
void OnTimer()
{
   SyncAll();
}

//+------------------------------------------------------------------+
//| Chart event — manual sync button                                   |
//+------------------------------------------------------------------+
void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
{
   if(id == CHARTEVENT_OBJECT_CLICK && sparam == "btnSyncNow")
   {
      Print("Manual sync triggered...");
      SyncAll();
      ObjectSetInteger(0, "btnSyncNow", OBJPROP_STATE, false);
   }
}

//+------------------------------------------------------------------+
//| Combined sync — single API call for both open + closed trades     |
//+------------------------------------------------------------------+
void SyncAll()
{
   string openJson = BuildOpenPositionsJson();
   string closedJson = BuildClosedTradesJson();

   bool hasOpen = (StringLen(openJson) > 2);
   bool hasClosed = (StringLen(closedJson) > 2);

   if(!hasOpen && !hasClosed) return;

   // Combine into single array: merge contents of both []
   string combined = "[";
   if(hasOpen)
      combined += StringSubstr(openJson, 1, StringLen(openJson) - 2);
   if(hasOpen && hasClosed)
      combined += ",";
   if(hasClosed)
      combined += StringSubstr(closedJson, 1, StringLen(closedJson) - 2);
   combined += "]";

   if(SendToApi(combined))
   {
      // Persist last synced ticket after successful API call
      string gvName = "TradeKav_LastTicket_" + IntegerToString(InpAccountId);
      GlobalVariableSet(gvName, g_lastTicket);
      Print("Synced successfully. Last ticket: ", g_lastTicket);
   }
}

//+------------------------------------------------------------------+
//| Build JSON for open positions (no API call)                       |
//+------------------------------------------------------------------+
string BuildOpenPositionsJson()
{
   int totalPositions = PositionsTotal();
   if(totalPositions == 0) return "[]";

   string jsonPayload = "[";
   int count = 0;
   int timezoneOffset = (int)(TimeCurrent() - TimeGMT());

   for(int i = 0; i < totalPositions; i++)
   {
      ulong posTicket = PositionGetTicket(i);
      if(posTicket == 0) continue;

      string symbol     = PositionGetString(POSITION_SYMBOL);
      long   posType    = PositionGetInteger(POSITION_TYPE);
      double volume     = PositionGetDouble(POSITION_VOLUME);
      double openPrice  = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl         = PositionGetDouble(POSITION_SL);
      double tp         = PositionGetDouble(POSITION_TP);
      double profit     = PositionGetDouble(POSITION_PROFIT);
      double swap       = PositionGetDouble(POSITION_SWAP);
      double commission = 0.0;
      long   posTime    = PositionGetInteger(POSITION_TIME);
      double curPrice   = PositionGetDouble(POSITION_PRICE_CURRENT);

      string direction;
      if(posType == POSITION_TYPE_BUY)
         direction = "BUY";
      else if(posType == POSITION_TYPE_SELL)
         direction = "SELL";
      else
         continue;

      datetime utcOpenTime = (datetime)posTime - timezoneOffset;
      int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);

      double pipSize = MathPow(10, -digits);
      if(digits == 3 || digits == 5)
         pipSize *= 10;

      double pips = 0;
      if(openPrice > 0 && curPrice > 0)
      {
         if(direction == "BUY")
            pips = (curPrice - openPrice) / pipSize;
         else
            pips = (openPrice - curPrice) / pipSize;
      }

      double entryRisk = MathAbs(openPrice - sl);
      double rMultiple = 0;
      if(entryRisk > 0)
      {
         double reward = (direction == "BUY") ? (curPrice - openPrice) : (openPrice - curPrice);
         rMultiple = reward / entryRisk;
      }

      if(count > 0) jsonPayload += ",";

      jsonPayload += "{";
      jsonPayload += "\"ticket\":" + IntegerToString(posTicket) + ",";
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
      jsonPayload += "\"chartData\":" + GetChartDataJson(symbol, (datetime)posTime, 0, timezoneOffset);
      jsonPayload += "}";

      count++;
   }

   jsonPayload += "]";
   return jsonPayload;
}

//+------------------------------------------------------------------+
//| Build JSON for closed trades (no API call)                        |
//+------------------------------------------------------------------+
string BuildClosedTradesJson()
{
   datetime fromDate;
   if(g_lastTicket == 0)
      fromDate = TimeCurrent() - InpLookbackDays * 86400;
   else
      fromDate = g_lastSyncTime > 0 ? g_lastSyncTime - 86400 : TimeCurrent() - 86400;

   if(!HistorySelect(fromDate, TimeCurrent()))
   {
      Print("Failed to select trade history");
      return "[]";
   }

   int totalDeals = HistoryDealsTotal();
   if(totalDeals == 0) return "[]";

   ulong closingTickets[];
   int closingCount = 0;
   ArrayResize(closingTickets, 0);

   for(int i = 0; i < totalDeals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;
      if((int)ticket <= g_lastTicket) continue;

      long dealEntry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(dealEntry != DEAL_ENTRY_OUT) continue;

      closingCount++;
      ArrayResize(closingTickets, closingCount);
      closingTickets[closingCount - 1] = ticket;
   }

   if(closingCount == 0) return "[]";

   string jsonPayload = "[";
   int newTrades = 0;
   int maxTicket = g_lastTicket;
   int timezoneOffset = (int)(TimeCurrent() - TimeGMT());

   for(int tIdx = 0; tIdx < closingCount; tIdx++)
   {
      ulong ticket = closingTickets[tIdx];
      if(!HistoryDealSelect(ticket)) continue;

      string symbol      = HistoryDealGetString(ticket, DEAL_SYMBOL);
      long   dealType    = HistoryDealGetInteger(ticket, DEAL_TYPE);
      double volume      = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      double dealPrice   = HistoryDealGetDouble(ticket, DEAL_PRICE);
      double profit      = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      double commission  = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      double swap        = HistoryDealGetDouble(ticket, DEAL_SWAP);
      long   dealTime    = HistoryDealGetInteger(ticket, DEAL_TIME);
      long   positionId  = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);

      double openPrice = 0;
      double openCommission = 0;
      double sl = 0;
      double tp = 0;
      datetime openTime = 0;

      FindOpenDealDetails(positionId, openPrice, openCommission, sl, tp, openTime);

      datetime utcOpenTime = openTime - timezoneOffset;
      datetime utcCloseTime = (datetime)dealTime - timezoneOffset;
      double totalCommission = openCommission + commission;

      string direction;
      if(dealType == DEAL_TYPE_SELL)
         direction = "BUY";
      else if(dealType == DEAL_TYPE_BUY)
         direction = "SELL";
      else
         continue;

      int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
      double pipSize = MathPow(10, -digits);
      if(digits == 3 || digits == 5)
         pipSize *= 10;

      double pips = 0;
      if(openPrice > 0)
      {
         if(direction == "BUY")
            pips = (dealPrice - openPrice) / pipSize;
         else
            pips = (openPrice - dealPrice) / pipSize;
      }

      double entryRisk = MathAbs(openPrice - sl);
      double rMultiple = 0;
      if(entryRisk > 0)
      {
         double reward = (direction == "BUY") ? (dealPrice - openPrice) : (openPrice - dealPrice);
         rMultiple = reward / entryRisk;
      }

      ulong syncTicket = (ulong)positionId;

      if(newTrades > 0) jsonPayload += ",";

      jsonPayload += "{";
      jsonPayload += "\"ticket\":" + IntegerToString(syncTicket) + ",";
      jsonPayload += "\"symbol\":\"" + symbol + "\",";
      jsonPayload += "\"direction\":\"" + direction + "\",";
      jsonPayload += "\"openTime\":\"" + FormatDateTime(utcOpenTime) + "\",";
      jsonPayload += "\"closeTime\":\"" + FormatDateTime(utcCloseTime) + "\",";
      jsonPayload += "\"openPrice\":" + DoubleToString(openPrice, digits) + ",";
      jsonPayload += "\"closePrice\":" + DoubleToString(dealPrice, digits) + ",";
      jsonPayload += "\"lotSize\":" + DoubleToString(volume, 2) + ",";
      jsonPayload += "\"stopLoss\":" + DoubleToString(sl, digits) + ",";
      jsonPayload += "\"takeProfit\":" + DoubleToString(tp, digits) + ",";
      jsonPayload += "\"profitUsd\":" + DoubleToString(profit, 2) + ",";
      jsonPayload += "\"commission\":" + DoubleToString(totalCommission, 2) + ",";
      jsonPayload += "\"swap\":" + DoubleToString(swap, 2) + ",";
      jsonPayload += "\"pips\":" + DoubleToString(pips, 1) + ",";
      jsonPayload += "\"rMultiple\":" + DoubleToString(rMultiple, 2) + ",";
      jsonPayload += "\"chartData\":" + GetChartDataJson(symbol, openTime, (datetime)dealTime, timezoneOffset);
      jsonPayload += "}";

      newTrades++;

      if((int)ticket > maxTicket)
         maxTicket = (int)ticket;
   }

   jsonPayload += "]";

   if(newTrades == 0) return "[]";

   g_lastTicket = maxTicket;
   g_lastSyncTime = TimeCurrent();

   return jsonPayload;
}

//+------------------------------------------------------------------+
//| Send JSON payload to the sync API endpoint                         |
//+------------------------------------------------------------------+
bool SendToApi(string jsonPayload)
{
   string url = InpApiUrl + "/api/trades/sync";
   string headers = "Content-Type: application/json\r\n";
   if(StringLen(g_authHeader) > 0)
      headers += g_authHeader + "\r\n";

   uchar postData[];
   StringToCharArray(jsonPayload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(postData, ArraySize(postData) - 1);

   uchar result[];
   string resultHeaders;

   int response = WebRequest("POST", url, headers, 5000, postData, result, resultHeaders);

   if(response == 200 || response == 201)
   {
      if(InpSyncInterval > 0)
         EventSetTimer(InpSyncInterval);
      return true;
   }
   else if(response == 429)
   {
      Print("Rate limit reached (429). Setting sync interval to 1 hour.");
      EventSetTimer(3600);
   }
   else if(response == -1)
   {
      Print("WebRequest failed. Error: ", GetLastError(),
            ". Make sure API URL is added to Tools -> Options -> Expert Advisors -> Allowed URLs");
   }
   else
   {
      string responseBody = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
      Print("Failed to send data: ", response, " — ", responseBody);
   }
   return false;
}

//+------------------------------------------------------------------+
//| Find open deal details for a position                             |
//+------------------------------------------------------------------+
void FindOpenDealDetails(ulong positionId, double &openPrice, double &openCommission, double &sl, double &tp, datetime &openTime)
{
   if(!HistorySelectByPosition(positionId))
   {
      Print("Failed to select position history in FindOpenDealDetails for position ", positionId);
      return;
   }

   int totalDeals = HistoryDealsTotal();

   for(int i = 0; i < totalDeals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      long dealEntry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      long dealPosId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);

      if(dealPosId == (long)positionId && dealEntry == DEAL_ENTRY_IN)
      {
         openPrice      = HistoryDealGetDouble(ticket, DEAL_PRICE);
         openTime       = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
         openCommission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
         break;
      }
   }

   sl = 0;
   tp = 0;
   int totalOrders = HistoryOrdersTotal();
   for(int i = 0; i < totalOrders; i++)
   {
      ulong orderTicket = HistoryOrderGetTicket(i);
      if(orderTicket == 0) continue;

      long orderPosId = HistoryOrderGetInteger(orderTicket, ORDER_POSITION_ID);
      if(orderPosId != (long)positionId) continue;

      double orderSl = HistoryOrderGetDouble(orderTicket, ORDER_SL);
      double orderTp = HistoryOrderGetDouble(orderTicket, ORDER_TP);

      if(orderSl > 0) sl = orderSl;
      if(orderTp > 0) tp = orderTp;
   }
}

//+------------------------------------------------------------------+
//| Format datetime to ISO 8601 string                                 |
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
//| Get historical candlestick data formatted as JSON array           |
//+------------------------------------------------------------------+
string GetChartDataJson(string symbol, datetime openTime, datetime closeTime, int timezoneOffset)
{
   if(openTime == 0) return "null";

   datetime curTime = TimeCurrent();
   datetime end = (closeTime == 0) ? curTime : closeTime;

   ENUM_TIMEFRAMES timeframe = PERIOD_M1;
   long duration = (long)(end - openTime);

   if(duration > 15 * 24 * 3600) timeframe = PERIOD_D1;
   else if(duration > 4 * 24 * 3600) timeframe = PERIOD_H4;
   else if(duration > 24 * 3600) timeframe = PERIOD_H1;
   else if(duration > 8 * 3600) timeframe = PERIOD_M15;
   else if(duration > 1.5 * 3600) timeframe = PERIOD_M5;
   else timeframe = PERIOD_M1;

   int periodSec = PeriodSeconds(timeframe);
   datetime startSearch = openTime - 15 * periodSec;
   datetime endSearch = end + 15 * periodSec;
   if(endSearch > curTime) endSearch = curTime;

   MqlRates rates[];
   int copied = CopyRates(symbol, timeframe, startSearch, endSearch, rates);
   if(copied <= 0)
   {
      return "null";
   }

   int startIdx = 0;
   int endIdx = copied - 1;
   if(copied > 120)
   {
      int openIdx = 0;
      for(int i = 0; i < copied; i++)
      {
         if(rates[i].time >= openTime)
         {
            openIdx = i;
            break;
         }
      }

      startIdx = openIdx - 20;
      if(startIdx < 0) startIdx = 0;
      endIdx = startIdx + 119;
      if(endIdx >= copied)
      {
         endIdx = copied - 1;
         startIdx = endIdx - 119;
         if(startIdx < 0) startIdx = 0;
      }
   }

   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);

   string json = "[";
   int barCount = 0;
   for(int i = startIdx; i <= endIdx; i++)
   {
      if(barCount > 0) json += ",";

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
