import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, HelpCircle } from "lucide-react";

export default function Support() {
  const handleEmailClick = () => {
    window.location.href = "mailto:plannerblueberry@gmail.com?subject=Blueberry Planner Support";
  };

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-[#D2691E]">Support</h1>
      
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5 text-[#D2691E]" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-4">
          <p>
            We're here to help you get the most out of Blueberry Planner. If you have 
            any questions, issues, or feedback, please don't hesitate to reach out to us.
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-gradient-to-br from-[#D2691E]/5 to-[#E8954C]/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-[#D2691E]" />
            Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            For support inquiries, feature requests, or any other questions, please 
            send us an email. We typically respond within 24-48 hours.
          </p>
          
          <Button 
            onClick={handleEmailClick}
            className="w-full bg-[#D2691E] hover:bg-[#B8581A] text-white"
            data-testid="button-send-email"
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Email to plannerblueberry@gmail.com
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Or email us directly at:
            </p>
            <a 
              href="mailto:plannerblueberry@gmail.com" 
              className="text-[#D2691E] font-medium hover:underline"
              data-testid="link-support-email"
            >
              plannerblueberry@gmail.com
            </a>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-green-500" />
            What to Include
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p className="mb-3">When contacting support, please include:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>A clear description of your issue or question</li>
            <li>The device you're using (iPhone, Android, Web browser)</li>
            <li>Steps to reproduce the issue (if applicable)</li>
            <li>Any error messages you've received</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
