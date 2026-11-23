"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ProjectUsers } from '../../_components/ProjectUsers';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useProjectStore } from '@/lib/stores/project-store';
import { Editor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Send, Eye, Code, Mail } from 'lucide-react';

const DEFAULT_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      color: #27272a;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background-color: #ea580c; /* Primary */
      padding: 32px 40px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.025em;
    }
    .content {
      padding: 40px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 24px;
      color: #18181b;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 32px;
      color: #3f3f46;
    }
    .button-container {
      text-align: center;
      margin-top: 32px;
    }
    .button {
      display: inline-block;
      background-color: #ea580c;
      color: #ffffff;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 16px;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #7c3aed;
    }
    .footer {
      background-color: #fafafa;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e4e4e7;
    }
    .footer p {
      font-size: 14px;
      color: #71717a;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome Aboard! 🚀</h1>
    </div>
    <div class="content">
      <div class="greeting">Hi {{user.name}},</div>
      <div class="message">
        <p>We're absolutely thrilled to have you join our community! Your account has been successfully created, and you're now ready to explore everything we have to offer.</p>
        <p>Get started by setting up your profile and diving into your dashboard. If you need any help along the way, our support team is always here for you.</p>
      </div>
      <div class="button-container">
        <a href="#" class="button">Get Started Now</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2026 {{project.name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

function WelcomeEmailTab({ id }: { id: string }) {
    const { currentApiKey, currentProjectName } = useProjectStore();
    console.log("current api key", currentApiKey);
    console.log("current project name", currentProjectName);
    const apiKey = currentApiKey;

    const { data: emails, refetch, isLoading: emailsLoading } = useQuery({
        queryKey: ['custom-emails', id],
        queryFn: () => api.customEmail.list(apiKey!),
        enabled: !!apiKey,
    });

    const emailConfigs = emails?.result.filter((e: any) => e.name === "Welcome Email") || [];

    const welcomeEmail = emailConfigs.find((e: any) => e.name === "Welcome Email") || emailConfigs[0];
    console.log(welcomeEmail);
    console.log(emailConfigs);

    const [body, setBody] = useState(DEFAULT_EMAIL_TEMPLATE);
    const [subject, setSubject] = useState("Welcome Aboard! 🚀");
    const [testEmail, setTestEmail] = useState("");

    useEffect(() => {
        if (welcomeEmail) {
            if (welcomeEmail.body) setBody(welcomeEmail.body);
            if (welcomeEmail.subject) setSubject(welcomeEmail.subject);
        }
    }, [welcomeEmail]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (welcomeEmail?.id) {
                return await api.customEmail.update(apiKey!, welcomeEmail.id, {
                    name: "Welcome Email",
                    subject: subject || "Welcome to our app!",
                    body: body
                });
            } else {
                return await api.customEmail.create(apiKey!, {
                    name: "Welcome Email",
                    subject: subject || "Welcome to our app!",
                    body: body || "Hi {{user.name}}, welcome onboard!"
                });
            }
        },
        onSuccess: () => {
            toast.success("Email template saved!");
            refetch();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to save template");
        }
    });

    const sendTestMutation = useMutation({
        mutationFn: async () => {
            if (!testEmail) throw new Error("Please enter a test email address");
            if (!welcomeEmail?.id) throw new Error("Please save the template first");
            return await api.customEmail.send(apiKey!, welcomeEmail.id, {
                to: testEmail,
                name: "John Doe",
                projectName: currentProjectName || ""
            });
        },
        onSuccess: () => {
            toast.success("Test email sent!");
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to send test email");
        }
    });

    const previewHtml = body.replace(/\{\{user\.name\}\}/g, 'John Doe').replace(/\{\{name\}\}/g, 'John Doe').replace(/\{\{project\.name\}\}/g, currentProjectName || "");

    if (emailsLoading || !apiKey) return <div className="p-4"><Skeleton className="h-[400px] w-full bg-white/10" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white">Welcome Email Template</h2>
                    <p className="text-sm text-gray-400">Configure the email sent when a user signs up.</p>
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/20">
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? "Saving..." : "Save Template"}
                </Button>
            </div>

            <div className="space-y-4">
                <div>
                    <Label className="text-gray-300">Subject</Label>
                    <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="bg-black/50 border-white/10 text-white mt-1.5 focus:border-primary-500/50 focus:ring-primary-500/20 h-11"
                        placeholder="Welcome to our app!"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <Code className="w-4 h-4 text-primary-500" /> Template Editor
                    </div>
                    <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                        <Editor
                            height="500px"
                            defaultLanguage="html"
                            theme="vs-dark"
                            value={body}
                            onChange={(val) => setBody(val || "")}
                            options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                        ✨ Variables support: Hello <code className="bg-white/10 px-1.5 py-0.5 rounded text-primary-400 font-mono">{"{{user.name}}"}</code>
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <Eye className="w-4 h-4 text-blue-500" /> Email Preview
                    </div>
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-white h-[500px] shadow-2xl relative">
                        <div className="absolute inset-0 bg-white" />
                        <iframe
                            srcDoc={previewHtml}
                            style={{ position: 'relative', zIndex: 10, height: '100%', width: '100%', border: 'none' }}
                            title="Email Preview"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 border border-white/10 rounded-xl bg-neutral-900/60 space-y-4 shadow-xl backdrop-blur-sm">
                <h3 className="font-medium text-white flex items-center gap-2 pb-3 border-b border-white/10">
                    <Mail className="w-5 h-5 text-green-500" />
                    Test Email Delivery
                </h3>
                <div className="flex flex-col sm:flex-row items-end gap-4 max-w-xl">
                    <div className="flex-1 space-y-1.5 w-full">
                        <Label className="text-gray-400 text-xs tracking-wide uppercase">Test Email Address</Label>
                        <Input
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="tester@example.com"
                            className="bg-black/50 border-white/10 text-white h-11 focus:border-green-500/50 focus:ring-green-500/20"
                        />
                    </div>
                    <Button onClick={() => sendTestMutation.mutate()} disabled={sendTestMutation.isPending} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white h-11 w-full sm:w-auto">
                        <Send className="w-4 h-4 mr-2" />
                        {sendTestMutation.isPending ? "Sending..." : "Send Test"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function ProjectUsersPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    useEffect(() => {
        if (!localStorage.getItem("platform_token")) {
            router.push("/platform/login");
            return;
        }
    }, [router]);

    const fetchUsers = async (projectId: string) => {
        try {
            const data = await api.projects.getUsers(projectId);
            return data.users || [];
        } catch (error: any) {
            console.error("Failed to fetch project users", error);
            toast.error("Failed to load users");
            return [];
        }
    };
    const { refetch, data: users, isLoading } = useQuery({
        queryKey: ["project-users", id],
        queryFn: () => fetchUsers(id),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="space-y-6 pt-4">
                <Skeleton className="h-8 w-32 bg-white/10" />
                <div className="border border-white/10 rounded-lg p-4 bg-neutral-900/50">
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full bg-white/5" />
                        <Skeleton className="h-12 w-full bg-white/5" />
                        <Skeleton className="h-12 w-full bg-white/5" />
                        <Skeleton className="h-12 w-full bg-white/5" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-4">
            <Tabs defaultValue="users" className="w-full">
                <TabsList className="bg-neutral-900/80 border border-white/10 p-1 mb-6 rounded-lg backdrop-blur-sm">
                    <TabsTrigger value="users" className="rounded-md px-6 data-[state=active]:bg-primary-500/20 data-[state=active]:text-primary-400 font-medium transition-all">Users List</TabsTrigger>
                    <TabsTrigger value="welcome-email" className="rounded-md px-6 data-[state=active]:bg-primary-500/20 data-[state=active]:text-primary-400 font-medium transition-all">Welcome Email</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="mt-0 outline-none">
                    <ProjectUsers users={users || []} refetch={refetch} />
                </TabsContent>

                <TabsContent value="welcome-email" className="mt-0 outline-none">
                    <WelcomeEmailTab id={id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
