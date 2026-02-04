import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, Lock, Eye, Trash2, Mail, AlertTriangle } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-[#D2691E]">Privacy Policy & Disclaimer</h1>
      
      <p className="text-sm text-muted-foreground">
        Last updated: February 2026
      </p>

      {/* Privacy Policy Section */}
      <h2 className="text-xl font-display font-semibold text-[#D2691E] mt-2">Privacy Policy</h2>

      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-[#D2691E]" />
            Introduction
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            Blueberry Planner ("we," "our," or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your 
            information when you use our mobile application and web service.
          </p>
          <p>
            By using Blueberry Planner, you agree to the collection and use of information 
            in accordance with this policy.
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-blue-500" />
            Information We Collect
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p><strong>Account Information:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Email address and password for adult accounts</li>
            <li>Name and profile information</li>
            <li>Family member names and roles</li>
            <li>PIN codes for kid accounts</li>
          </ul>
          
          <p><strong>App Data:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Medication schedules and reminders</li>
            <li>Chore assignments and completion status</li>
            <li>Grocery lists</li>
            <li>Calendar events and reminders</li>
            <li>Profile photos (if uploaded)</li>
          </ul>

          <p><strong>Device Information:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Device type and operating system</li>
            <li>Push notification tokens (for reminders)</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-green-500" />
            How We Use Your Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>We use your information to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provide and maintain our service</li>
            <li>Send medication reminders and notifications</li>
            <li>Sync data across your devices</li>
            <li>Manage your family's organization tasks</li>
            <li>Respond to your support requests</li>
            <li>Improve our application</li>
          </ul>
          <p>
            We do not sell, rent, or share your personal information with third parties 
            for marketing purposes.
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-amber-500" />
            Data Security
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            We implement reasonable security measures to protect your personal information. 
            However, no method of transmission over the internet or electronic storage is 
            100% secure.
          </p>
          <p>
            Your account is protected by a password or PIN. You are responsible for 
            maintaining the confidentiality of your login credentials.
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trash2 className="h-5 w-5 text-red-500" />
            Data Retention & Deletion
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            We retain your data for as long as your account is active or as needed to 
            provide you services.
          </p>
          <p>
            You may request deletion of your account and associated data at any time by 
            contacting us at the email address below. We will delete your data within 
            30 days of receiving your request.
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            Children's Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            Blueberry Planner allows family accounts with child members. Child accounts 
            are managed by adult guardians and use PIN-based authentication. We do not 
            knowingly collect personal information from children without parental consent.
          </p>
          <p>
            Parents/guardians have full control over their children's data and can modify 
            or delete it at any time through the app settings.
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            Changes to This Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of 
            any changes by posting the new Privacy Policy on this page and updating the 
            "Last updated" date.
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer Section */}
      <h2 className="text-xl font-display font-semibold text-[#D2691E] mt-6">Disclaimer</h2>

      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            General Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            Blueberry Planner is provided "as is" without any warranties, express or implied. 
            The app owner and developers are not responsible for any damages, losses, or issues 
            arising from the use of this application.
          </p>
          <p>
            This application is intended as a family organization tool only. It is not a 
            substitute for professional medical advice, diagnosis, or treatment. Always seek 
            the advice of qualified health providers with any questions regarding medications 
            or medical conditions.
          </p>
          <p>
            The app owner is not responsible for any missed reminders, incorrect medication 
            tracking, scheduling errors, or any consequences resulting from reliance on 
            this application.
          </p>
          <p>
            Users are solely responsible for verifying the accuracy of all information 
            entered into the application and for ensuring that all tasks, medications, 
            and schedules are properly managed.
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-blue-500" />
            Security Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            While we implement reasonable security measures to protect your data, the app 
            owner and developers are not responsible for any unauthorized access, data 
            breaches, or security incidents that may occur.
          </p>
          <p>
            Users are responsible for maintaining the confidentiality of their login 
            credentials and for all activities that occur under their account.
          </p>
          <p>
            We recommend using strong, unique passwords and not sharing your account 
            credentials with others. The app owner is not liable for any damages resulting 
            from unauthorized access to your account.
          </p>
          <p>
            Data stored in this application may be transmitted over the internet. The app 
            owner is not responsible for any interception, loss, or alteration of data 
            during transmission.
          </p>
          <p>
            By using this application, you acknowledge and accept these disclaimers and 
            agree that the app owner shall not be held liable for any claims, damages, 
            or losses arising from your use of the application.
          </p>
        </CardContent>
      </Card>

      {/* Contact Section */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-[#D2691E]/5 to-[#E8954C]/10 mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-[#D2691E]" />
            Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            If you have any questions about this Privacy Policy, our disclaimers, or our data practices, 
            please contact us at:
          </p>
          <a 
            href="mailto:plannerblueberry@gmail.com" 
            className="text-[#D2691E] font-medium hover:underline block"
            data-testid="link-privacy-email"
          >
            plannerblueberry@gmail.com
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
