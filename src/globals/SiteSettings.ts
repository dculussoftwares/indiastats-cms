import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
    slug: 'site-settings',
    label: 'Site Settings',
    access: {
        read: () => true,
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'General',
                    fields: [
                        {
                            name: 'siteName',
                            type: 'text',
                            required: true,
                            defaultValue: 'IndiaStats.org',
                            admin: {
                                description: 'The name of your site',
                            },
                        },
                        {
                            name: 'siteTagline',
                            type: 'text',
                            defaultValue: 'Tamil Nadu Election Data & Statistics',
                            admin: {
                                description: 'A short tagline for your site',
                            },
                        },
                        {
                            name: 'siteDescription',
                            type: 'textarea',
                            defaultValue:
                                'Comprehensive election data, voter statistics, and political insights for Tamil Nadu assembly constituencies. Explore MLA history, booth-level data, and demographic trends.',
                            admin: {
                                description: 'Default meta description for your site',
                            },
                        },
                    ],
                },
                {
                    label: 'Social Media',
                    fields: [
                        {
                            name: 'twitterHandle',
                            type: 'text',
                            defaultValue: '@IndiaStatsOrg',
                            admin: {
                                description: 'Twitter handle (include @)',
                            },
                        },
                        {
                            name: 'linkedinUrl',
                            type: 'text',
                            admin: {
                                description: 'LinkedIn page URL',
                            },
                        },
                        {
                            name: 'facebookUrl',
                            type: 'text',
                            admin: {
                                description: 'Facebook page URL',
                            },
                        },
                    ],
                },
                {
                    label: 'SEO Defaults',
                    fields: [
                        {
                            name: 'defaultOgImage',
                            type: 'upload',
                            relationTo: 'media',
                            admin: {
                                description: 'Default Open Graph image for social shares',
                            },
                        },
                        {
                            name: 'defaultKeywords',
                            type: 'text',
                            defaultValue:
                                'Tamil Nadu elections, assembly constituency, voter data, MLA history, election statistics, India elections',
                            admin: {
                                description: 'Default keywords for SEO (comma-separated)',
                            },
                        },
                        {
                            name: 'googleSiteVerification',
                            type: 'text',
                            admin: {
                                description: 'Google Search Console verification code',
                            },
                        },
                        {
                            name: 'bingSiteVerification',
                            type: 'text',
                            admin: {
                                description: 'Bing Webmaster Tools verification code',
                            },
                        },
                    ],
                },
                {
                    label: 'Analytics',
                    fields: [
                        {
                            name: 'clarityId',
                            type: 'text',
                            admin: {
                                description: 'Microsoft Clarity project ID (set via environment variable in production)',
                            },
                        },
                        {
                            name: 'posthogKey',
                            type: 'text',
                            admin: {
                                description: 'PostHog project API key (set via environment variable in production)',
                            },
                        },
                        {
                            name: 'mixpanelToken',
                            type: 'text',
                            admin: {
                                description: 'Mixpanel project token (set via environment variable in production)',
                            },
                        },
                    ],
                },
            ],
        },
    ],
}
