# VPS Deployment Guide using Coolify

This guide explains step-by-step how to deploy this monorepo project (Next.js web client, Express API, and PostgreSQL database) onto a brand new, empty Linux VPS using **Coolify**.

---

## 1. Initial VPS Setup & Coolify Installation

Coolify handles dockerization, reverse-proxy routing (Traefik), Let's Encrypt SSL, and database management automatically. You only need to run a single installation command on your server.

### Connect to your VPS via SSH
Open your terminal and run:
```bash
ssh root@<YOUR_VPS_IP>
```

### Update Package Lists & Packages
Before installing anything, ensure your server packages are up-to-date:
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Coolify
Run the official Coolify installation script. This will automatically install Docker, Docker Compose, curl, Git, and other required dependencies:
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```
Once completed, Coolify will be running at `http://<YOUR_VPS_IP>:8000`. Open this address in your browser, create your admin account, and sign in.

### Configure Docker Registry Mirror (Required for Restricted Networks like Iran)

If your VPS is located in a region where Docker Hub is blocked or throttled (e.g., Iran), you must configure a local registry mirror on your VPS so Docker can pull base images successfully:

1. Open or create the Docker daemon config file:
   ```bash
   sudo nano /etc/docker/daemon.json
   ```

2. Add the following registry mirror configuration:
   ```json
   {
     "registry-mirrors": [
       "https://docker.ir",
       "https://docker.arvancloud.ir"
     ]
   }
   ```

3. Reload daemon configurations and restart Docker:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart docker
   ```

---

## 2. DNS Configuration (Prerequisite)

Before deploying, you must configure your domain's DNS records so that both your main domain and the API subdomain point to your VPS. 

In your domain registrar (e.g., Cloudflare, Namecheap, GoDaddy), add the following **A Records**:

| Type | Host/Name | Value / Points to | Description |
| :--- | :--- | :--- | :--- |
| **A** | `@` (or blank) | `<YOUR_VPS_IP>` | Points your root domain (e.g., `yourdomain.com`) to the VPS. |
| **A** | `api` | `<YOUR_VPS_IP>` | Points your backend API subdomain (e.g., `api.yourdomain.com`) to the VPS. |

*Note: Once you point these records, Coolify's built-in reverse proxy (Traefik) will intercept requests on ports 80/443 and automatically route them to the correct application based on the incoming domain name. It also handles Let's Encrypt SSL configuration automatically.*

---

## 3. Set Up PostgreSQL Database in Coolify

Coolify offers one-click database services.

1. In the Coolify Dashboard, click on **Projects** → **Default** → **Production**.
2. Click **New Resource** (or **Add Resource**) and choose **PostgreSQL**.
3. Configure the database details:
   * **Database Name:** `trade_journal`
   * **Username:** `postgres`
   * **Password:** 
4. Click **Start Database**.
5. Once started, copy the **Internal Connection String** (e.g., `postgresql://postgres:password@postgresql:5432/trade_journal`). This is what your API container will use to communicate with the database internally without exposing database ports publicly.

---

## 4. Connect your Git Repository

1. In Coolify, go to **Keys & Sources** → **Git Sources**.
2. Select **GitHub** (or **GitLab** / **Custom Git Server**).
3. Connect using a **GitHub App** (recommended) or add your SSH key to access private repositories.

---

## 5. Deploy Backend API

1. Go to your Project page and click **New Resource** → **Public/Private Repository**.
2. Select your repository and branch.
3. Select **Dockerfile** as the build pack (recommended for monorepos and low resource usage).
4. Configure the **Build & Routing settings**:
   * **Application Port:** `3000`
   * **Base Directory:** `/` (must be the root directory to access root workspace packages).
   * **Dockerfile Path:** `apps/api/Dockerfile`
   * **Domain:** Assign your subdomain (e.g. `https://api.tradekav.ir`). Coolify will auto-request Let's Encrypt SSL.

5. Configure **Environment Variables**:
   Add the following variables under the **Environment Variables** tab:
   * `DATABASE_URL` = `<Your_Internal_PostgreSQL_Connection_String>`
   * `JWT_ACCESS_SECRET` = `<Generate_A_Secure_Random_Secret_Key>`
   * `JWT_ACCESS_EXPIRES_IN` = `15m`
   * `NODE_ENV` = `production`
   * `PORT` = `3000`

6. **Database Migrations:**
   *(Note: The Dockerfile is pre-configured to automatically run `npx prisma migrate deploy` on startup to initialize/update your database tables, so you do not need to configure any manual hooks or pre-start commands in Coolify).*

7. Click **Deploy**.

---

## 6. Deploy Frontend Web (Next.js)

1. Go back to your Project page and click **New Resource** → **Public/Private Repository**.
2. Select the same repository and branch.
3. Select **Dockerfile** as the build pack (recommended for monorepos and low resource usage).
4. Configure the **Build & Routing settings**:
   * **Application Port:** `3000` (Next.js standard port).
   * **Base Directory:** `/` (must be the root directory to access root workspace packages).
   * **Dockerfile Path:** `apps/web/Dockerfile`
   * **Domain:** Assign your root domain (e.g., `https://yourdomain.com`).

5. Configure **Environment Variables**:
   * `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com` (your backend API endpoint).
   * `NEXT_PUBLIC_API_BASE_URL` = `https://api.yourdomain.com` (required by the HTTP client wrapper).
   * `NEXT_PUBLIC_WEB_URL` = `https://yourdomain.com` (your frontend domain).

6. Click **Deploy**.

---

## 7. Static Upload Directory Persistency (Multer Uploads)

Since users upload payment receipts and avatars, these files are saved on the disk at `apps/api/uploads`. If the container restarts, these files will be lost unless we create a **Persistent Volume**.

1. Go to your **Backend API** resource page in Coolify.
2. Select the **Storage** or **Volumes** tab.
3. Add a new volume mount:
   * **Volume Name:** `uploads-cache`
   * **Path inside container:** `/app/apps/api/uploads` (or the folder relative to where the server starts, i.e., `/usr/src/app/uploads` or `/app/uploads` depending on directory layout).
4. Save and redeploy. This ensures uploaded files persist across server updates.
