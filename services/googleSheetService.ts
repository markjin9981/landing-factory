import { LeadData, VisitData } from '../types';

/**
 * --------------------------------------------------------------------------
 * IMPORTANT: GOOGLE APPS SCRIPT SETUP INSTRUCTIONS
 * --------------------------------------------------------------------------
 * 1. Update your Apps Script with the code in backend/Code.gs (includes doGet).
 * 2. Deploy as Web App:
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 3. Paste the Web App URL below.
 * --------------------------------------------------------------------------
 */

// REPLACE THIS WITH YOUR ACTUAL GOOGLE APPS SCRIPT WEB APP URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzmAPb7GCs4PqCpL4Z3OKyCX4cRuqnxVLRieGPmnueZCFYM1c1wh8MoItZQ7F7iHB3o/exec"; 

const MOCK_DATA = [
    { "Timestamp": "2024-03-20 10:00:00", "Landing ID": "1", "Name": "홍길동 (예시)", "Phone": "010-1234-5678" },
    { "Timestamp": "2024-03-19 15:30:00", "Landing ID": "2", "Name": "김철수 (예시)", "Phone": "010-9876-5432" }
];

export const submitLeadToSheet = async (data: LeadData): Promise<boolean> => {
  if (GOOGLE_SCRIPT_URL.includes("https://script.google.com/macros/s/AKfycbzmAPb7GCs4PqCpL4Z3OKyCX4cRuqnxVLRieGPmnueZCFYM1c1wh8MoItZQ7F7iHB3o/exec")) {
      console.log("Mock Submit (URL not configured):", data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
  }

  try {
    const formData = new FormData();
    formData.append('type', 'lead'); 
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
            formData.append(key, String(data[key]));
        }
    });

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: formData,
      mode: "no-cors", 
    });

    return true;
  } catch (error) {
    console.error("Error submitting lead:", error);
    return false;
  }
};

export const logVisit = async (visit: {landing_id: string, ip: string, device: string, os: string, browser: string, referrer: string}): Promise<void> => {
    if (GOOGLE_SCRIPT_URL.includes("https://script.google.com/macros/s/AKfycbzmAPb7GCs4PqCpL4Z3OKyCX4cRuqnxVLRieGPmnueZCFYM1c1wh8MoItZQ7F7iHB3o/exec")) {
        console.log("Mock Visit Log:", visit);
        return;
    }

    try {
        const formData = new FormData();
        formData.append('type', 'visit');
        Object.keys(visit).forEach(key => {
             formData.append(key, String((visit as any)[key]));
        });

        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: formData,
            mode: "no-cors",
        });
    } catch (error) {
        console.error("Error logging visit", error);
    }
};

export const sendAdminNotification = async (email: string, subject: string, message: string): Promise<boolean> => {
    if (GOOGLE_SCRIPT_URL.includes("YOUR_SCRIPT_ID_HERE")) {
        console.log("Mock Email:", { email, subject, message });
        return true;
    }

    try {
        const formData = new FormData();
        formData.append('type', 'admin_email');
        formData.append('recipient', email);
        formData.append('subject', subject);
        formData.append('body', message);

        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: formData,
            mode: "no-cors",
        });
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

export const fetchLeads = async (): Promise<any[]> => {
    return fetchData('leads');
}

export const fetchVisits = async (): Promise<VisitData[]> => {
    return fetchData('visits');
}

const fetchData = async (type: 'leads' | 'visits'): Promise<any[]> => {
    // Prevent "Failed to fetch" error if URL is still the placeholder
    if (GOOGLE_SCRIPT_URL.includes("YOUR_SCRIPT_ID_HERE")) {
        console.warn(`Using mock data because GOOGLE_SCRIPT_URL is not configured.`);
        return type === 'leads' ? MOCK_DATA : [];
    }

    try {
        // Appending &type=... to GET request
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?type=${type}`);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        return type === 'leads' ? MOCK_DATA : [];
    }
}