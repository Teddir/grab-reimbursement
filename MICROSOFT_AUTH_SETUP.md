# Microsoft Entra ID (Azure AD) Authentication Setup Guide

This guide explains how to set up Microsoft Account authentication for the Grab Reimbursement Engine from scratch.

## 1. Register Application in Azure Portal

1.  Go to the [Azure Portal](https://portal.azure.com/) and search for **App registrations**.
2.  Click **+ New registration**.
3.  **Name**: `Grab Reimbursement Engine` (or your preferred name).
4.  **Supported account types**: 
    *   Select `Accounts in this organizational directory only` (Single Tenant) for corporate use.
    *   Select `Accounts in any organizational directory` (Multi Tenant) for broader access.
5.  **Redirect URI**:
    *   Select **Web** from the dropdown.
    *   Enter: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
    *   *Note: For production, add your production URL as well.*
6.  Click **Register**.

## 2. Collect Credentials

Once registered, copy the following from the **Overview** tab:
*   **Application (client) ID** $\rightarrow$ `AUTH_MICROSOFT_ENTRA_ID_ID`
*   **Directory (tenant) ID** $\rightarrow$ `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID`

## 3. Create Client Secret

1.  In the left sidebar, go to **Certificates & secrets**.
2.  Click **+ New client secret**.
3.  **Description**: `NextAuth Secret`
4.  **Expires**: Recommended 180 days (6 months).
5.  Click **Add**.
6.  **CRITICAL**: Copy the **Value** (not the ID) immediately. This value will be hidden forever once you leave the page.
    *   Value $\rightarrow$ `AUTH_MICROSOFT_ENTRA_ID_SECRET`

## 4. Configure API Permissions

1.  Go to **API permissions**.
2.  Ensure `Microsoft Graph > User.Read (Delegated)` is present. This allows the app to see the user's name and email for auto-filling the form.
3.  If not present, click **+ Add a permission** > **Microsoft Graph** > **Delegated permissions** > search for `User.Read`.

## 5. Update Environment Variables

Open `.env.local` in your project and fill in the values:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET= # Generate one using: npx auth secret

# Microsoft Entra ID Credentials
AUTH_MICROSOFT_ENTRA_ID_ID=your_client_id_here
AUTH_MICROSOFT_ENTRA_ID_SECRET=your_client_secret_value_here
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=your_tenant_id_here
```

## 6. How it Works in the App

1.  **Auth Guard**: The `app/page.tsx` checks for a session. If none exists, it displays the **Enterprise Login** screen.
2.  **Login**: Clicking "Sign in with Microsoft" triggers the Auth.js flow using the Microsoft Entra ID provider.
3.  **Auto-Fill**: Once logged in, the `useEffect` in `page.tsx` detects the session and automatically populates:
    *   `Nama Karyawan`: from `session.user.name`
    *   `Pemohon`: from `session.user.name`
4.  **Logout**: The header contains a logout button that clears the session and returns the user to the login screen.

## Troubleshooting

*   **Redirect URI Mismatch**: Ensure the URL in Azure matches exactly what is in your browser (including `http` vs `https`).
*   **Secret Expired**: If login suddenly stops working after months, check if your Client Secret has expired in the Azure Portal.
*   **Tenant Access**: If you get a "User not in directory" error, ensure your `TENANT_ID` is correct or set to `common` for multi-tenant access.
