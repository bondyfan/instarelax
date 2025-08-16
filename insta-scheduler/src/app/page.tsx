import Link from "next/link";
import { FaInstagram } from "react-icons/fa";
import Button from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <FaInstagram className="text-4xl text-pink-500 mx-auto mb-6" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Instagram Scheduler
        </h1>
        <p className="text-gray-600 mb-8">
          Private scheduling tool for Instagram posts
        </p>
        
        <div className="space-y-3">
          <Link href="/login" className="block">
            <Button size="lg" className="w-full">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard" className="block">
            <Button variant="outline" size="lg" className="w-full">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
