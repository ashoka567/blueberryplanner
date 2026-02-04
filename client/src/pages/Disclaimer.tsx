import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-[#D2691E]">Disclaimer</h1>
      
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

      <p className="text-xs text-center text-muted-foreground mt-4">
        Last updated: February 2026
      </p>
    </div>
  );
}
