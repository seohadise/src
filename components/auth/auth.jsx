import AuthFlow from "./auth-flow";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const Auth = () => {
  return (
    <div className="flex justify-between min-h-screen">
      <div className="bg-[url('/auth.jpg')] bg-center bg-no-repeat bg-cover w-[50%] hidden lg:block" />

      <div className="flex-1 flex items-center justify-center p-3">
        <Card className="lg:w-[500px] w-[355px] max-w-[355px] lg:max-w-none mx-auto">
          <CardHeader>
            <CardTitle>ورود / ثبت نام</CardTitle>
          </CardHeader>
          <CardContent>
            <AuthFlow />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
