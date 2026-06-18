//+------------------------------------------------------------------+
//|                                    TradeJournal_EA.mq5           |
//|            معامله‌یار — Trade History Sync Expert Advisor          |
//|                     Sends closed trades to API via HTTP           |
//+------------------------------------------------------------------+
#property copyright "Mo'amele-yar"
#property link      ""
#property version   "1.00"
#property strict

//--- Input parameters (configure in MT5 Properties → Inputs)
input string   InpApiUrl       = "http://127.0.0.1:3000";  // API Base URL
input string   InpApiToken     = "";                       // API Auth Token (leave empty if no auth)
input int      InpAccountId    = 1;                        // Account ID in معامله‌یار
input int      InpSyncInterval = 60;                       // Sync interval in seconds (0 = manual only)
input int      InpLookbackDays = 365;                      // How many days back to sync on first run

//--- Global variables
datetime g_lastSyncTime = 0;
int      g_lastTicket   = 0;
string   g_authHeader   = "";
bool     g_initialized  = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                     |
//+------------------------------------------------------------------+
int OnInit()
{
   // Build auth header if token provided
   if(StringLen(InpApiToken) > 0)
      g_authHeader = "Authorization: Bearer " + InpApiToken;
   
   // Load last synced ticket from global variable
   string gvName = "TradeJournal_LastTicket_" + IntegerToString(InpAccountId);
   if(GlobalVariableCheck(gvName))
      g_lastTicket = (int)GlobalVariableGet(gvName);
   
   // Set timer for periodic sync
   if(InpSyncInterval > 0)
      EventSetTimer(InpSyncInterval);
   
   // Do initial sync
   SyncTrades();
   
   Print("TradeJournal EA initialized. Last ticket: ", g_lastTicket);
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
//| Timer function — periodic sync                                     |
//+------------------------------------------------------------------+
void OnTimer()
{
   SyncTrades();
}

//+------------------------------------------------------------------+
//| Chart event — handle button press for manual sync                  |
//+------------------------------------------------------------------+
void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
{
   if(id == CHARTEVENT_OBJECT_CLICK && sparam == "btnSyncNow")
   {
      Print("Manual sync triggered...");
      SyncTrades();
      ObjectSetInteger(0, "btnSyncNow", OBJPROP_STATE, false);
   }
}

//+------------------------------------------------------------------+
//| Main sync function                                                |
//+------------------------------------------------------------------+
void SyncTrades()
{
   // Select history
   datetime fromDate;
   if(g_lastTicket == 0)
      fromDate = TimeCurrent() - InpLookbackDays * 86400;
   else
      fromDate = g_lastSyncTime > 0 ? g_lastSyncTime - 86400 : TimeCurrent() - 86400;
   
   if(!HistorySelect(fromDate, TimeCurrent()))
   {
      Print("Failed to select trade history");
      return;
   }
   
   int totalDeals = HistoryDealsTotal();
   if(totalDeals == 0)
   {
      Print("No deals found in history");
      return;
   }
   
   // Collect new closing deals
   string jsonPayload = "[";
   int newTrades = 0;
   int maxTicket = g_lastTicket;
   
   for(int i = 0; i < totalDeals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;
      
      // Skip already synced deals
      if((int)ticket <= g_lastTicket) continue;
      
      // Only process closing deals (entry out)
      long dealEntry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(dealEntry != DEAL_ENTRY_OUT) continue;
      
      // Get deal data
      string symbol      = HistoryDealGetString(ticket, DEAL_SYMBOL);
      long   dealType    = HistoryDealGetInteger(ticket, DEAL_TYPE);
      double volume      = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      double dealPrice   = HistoryDealGetDouble(ticket, DEAL_PRICE);
      double profit      = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      double commission  = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      double swap        = HistoryDealGetDouble(ticket, DEAL_SWAP);
      long   dealTime    = HistoryDealGetInteger(ticket, DEAL_TIME);
      long   positionId  = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      
      // Find the matching open deal for this position
      double openPrice = 0;
      double sl = 0;
      double tp = 0;
      datetime openTime = 0;
      
      FindOpenDealDetails(positionId, openPrice, sl, tp, openTime);
      
      // Direction: closing a BUY = SELL signal, closing a SELL = BUY signal
      // But for the trade journal, we record the ORIGINAL direction
      string direction;
      if(dealType == DEAL_TYPE_SELL)
         direction = "BUY";   // Closing a buy position
      else if(dealType == DEAL_TYPE_BUY)
         direction = "SELL";  // Closing a sell position
      else
         continue;
      
      // Calculate pips
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
      
      // Calculate R-multiple
      double entryRisk = MathAbs(openPrice - sl);
      double rMultiple = 0;
      if(entryRisk > 0)
         rMultiple = (profit + commission + swap) / entryRisk;
      
      // Build JSON for this trade
      if(newTrades > 0) jsonPayload += ",";
      
      jsonPayload += "{";
      jsonPayload += "\"ticket\":" + IntegerToString(ticket) + ",";
      jsonPayload += "\"symbol\":\"" + symbol + "\",";
      jsonPayload += "\"direction\":\"" + direction + "\",";
      jsonPayload += "\"openTime\":\"" + FormatDateTime((datetime)openTime) + "\",";
      jsonPayload += "\"closeTime\":\"" + FormatDateTime((datetime)dealTime) + "\",";
      jsonPayload += "\"openPrice\":" + DoubleToString(openPrice, digits) + ",";
      jsonPayload += "\"closePrice\":" + DoubleToString(dealPrice, digits) + ",";
      jsonPayload += "\"lotSize\":" + DoubleToString(volume, 2) + ",";
      jsonPayload += "\"stopLoss\":" + DoubleToString(sl, digits) + ",";
      jsonPayload += "\"takeProfit\":" + DoubleToString(tp, digits) + ",";
      jsonPayload += "\"profitUsd\":" + DoubleToString(profit, 2) + ",";
      jsonPayload += "\"commission\":" + DoubleToString(commission, 2) + ",";
      jsonPayload += "\"swap\":" + DoubleToString(swap, 2) + ",";
      jsonPayload += "\"pips\":" + DoubleToString(pips, 1) + ",";
      jsonPayload += "\"rMultiple\":" + DoubleToString(rMultiple, 2);
      jsonPayload += "}";
      
      newTrades++;
      
      if((int)ticket > maxTicket)
         maxTicket = (int)ticket;
   }
   
   jsonPayload += "]";
   
   if(newTrades == 0)
   {
      return;
   }
   
   // Send to API
   string url = InpApiUrl + "/api/trades/sync";
   string headers = "Content-Type: application/json\r\n";
   if(StringLen(g_authHeader) > 0)
      headers += g_authHeader + "\r\n";
   
   uchar postData[];
   StringToCharArray(jsonPayload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(postData, ArraySize(postData) - 1); // Remove null terminator
   
   uchar result[];
   string resultHeaders;
   
   int response = WebRequest("POST", url, headers, 5000, postData, result, resultHeaders);
   
   if(response == 200 || response == 201)
   {
      // Update last synced ticket
      g_lastTicket = maxTicket;
      g_lastSyncTime = TimeCurrent();
      string gvName = "TradeJournal_LastTicket_" + IntegerToString(InpAccountId);
      GlobalVariableSet(gvName, g_lastTicket);
      
      Print("Synced ", newTrades, " trades. Last ticket: ", g_lastTicket);
   }
   else if(response == -1)
   {
      Print("WebRequest failed. Error: ", GetLastError(), 
            ". Make sure API URL is added to Tools → Options → Expert Advisors → Allowed URLs");
   }
   else
   {
      string responseBody = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
      Print("API returned ", response, ": ", responseBody);
   }
}

//+------------------------------------------------------------------+
//| Find open deal details for a position                              |
//+------------------------------------------------------------------+
void FindOpenDealDetails(ulong positionId, double &openPrice, double &sl, double &tp, datetime &openTime)
{
   int totalDeals = HistoryDealsTotal();
   
   for(int i = 0; i < totalDeals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;
      
      long dealEntry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      long dealPosId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      
      if(dealPosId == (long)positionId && dealEntry == DEAL_ENTRY_IN)
      {
         openPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
         openTime  = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
         
         // Get SL/TP from the deal history
         sl = HistoryDealGetDouble(ticket, DEAL_SL);
         tp = HistoryDealGetDouble(ticket, DEAL_TP);
         return;
      }
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
