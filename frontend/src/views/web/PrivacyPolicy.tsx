import { Box, Typography, Divider } from '@mui/material';
import { LayoutWeb } from '../../layout/web/LayoutWeb';

export function PrivacyPolicy() {
  return (
    <LayoutWeb>
      <Box sx={{
        maxWidth: '900px',
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 4, sm: 6, md: 8 }
      }}>
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography 
            variant="h1" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 700
            }}
          >
            EZ CUSTOMERS — PRIVACY POLICY
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              mb: 1,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            Effective Date: October 21, 2025
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            Contact: <Box component="span" sx={{ color: 'primary.main' }}>ezcustomers.info@gmail.com</Box>
          </Typography>
        </Box>

        <Divider sx={{ mb: 5 }} />

        {/* Section 1 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            1. Introduction & Scope
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            This Privacy Policy describes how EZ Customers ("EZC", "we", "us", "our") collects, uses, stores, and discloses
            information from users ("you", "your") of our services. It applies to all users of the EZ Customers platform and
            related services. EZC complies with Canada's Personal Information Protection and Electronic Documents Act
            (PIPEDA), U.S. consumer privacy principles (including the California Consumer Privacy Act), and maintains
            readiness for EU General Data Protection Regulation (GDPR) standards.
          </Typography>
        </Box>

        {/* Section 2 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            2. Definitions
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary',
              mb: 2
            }}
          >
            <Box component="span" sx={{ fontWeight: 600 }}>"Personal Information"</Box> refers to data that identifies or can identify an individual, including contact, billing, and
            login details. <Box component="span" sx={{ fontWeight: 600 }}>"Usage Data"</Box> means analytical or technical data automatically collected through your use of the
            platform. <Box component="span" sx={{ fontWeight: 600 }}>"User Content"</Box> refers to creative works, files, or materials uploaded by Clients or Creatives, including
            audiovisual and intellectual property content.
          </Typography>
        </Box>

        {/* Section 3 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            3. Information We Collect
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary',
              mb: 2
            }}
          >
            We collect the following categories of information:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Personal identification data:</Box> name, email, phone number, and social media or professional handles.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Account information:</Box> login credentials, subscription tier, and transaction history.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Payment data:</Box> all payments and
                banking details are processed by Stripe and not stored directly by EZC.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Communications:</Box> emails and
                messages exchanged via EmailJS or within the platform.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Uploaded content:</Box> project files, audio stems, videos,
                photos, and related metadata.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Technical and analytical data:</Box> IP address, browser type, operating system,
                device information, and usage analytics collected via Google Analytics and Supabase logs.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Section 4 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            4. How We Use Personal Information
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary',
              mb: 2
            }}
          >
            We process personal information only as necessary for the following purposes:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                To operate, maintain, and improve the platform and user experience.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                To manage bookings, invoices, agreements, and payments.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                To verify identity, ensure content appropriateness, and maintain platform security.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                To communicate with users regarding transactions, support, and updates.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                To enforce compliance with our Terms of Service and applicable law.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                To analyze usage trends and performance metrics.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                To comply with legal and regulatory requirements.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Section 5 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            5. Legal Basis for Processing
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            EZC processes data under lawful bases including consent, performance of a contract, legitimate interest, and
            compliance with legal obligations, as applicable under PIPEDA, CCPA, and GDPR frameworks.
          </Typography>
        </Box>

        {/* Section 6 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            6. Data Retention & File Ownership
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            User Content remains the intellectual property of the uploader. EZC claims no ownership rights. Files are
            hosted solely for operational purposes. Personal data is retained
            only as long as necessary to fulfill the purposes described or as required by law.
          </Typography>
        </Box>

        {/* Section 7 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            7. Disclosure to Third Parties
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary',
              mb: 2
            }}
          >
            We share information with third-party processors only as necessary for platform functionality:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Stripe</Box> – for payment processing.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>EmailJS</Box> – for transactional and support email delivery.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Google Analytics</Box> – for site usage analytics.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Supabase</Box> – for database and storage services.
              </Typography>
            </Box>
          </Box>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary',
              mb: 2
            }}
          >
            Each third party processes data under contractual confidentiality and security obligations consistent with this
            Policy. EZC does not sell or rent user information to third parties.
          </Typography>
        </Box>

        {/* Section 8 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            8. Monitoring, Compliance, and Moderation Rights
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            EZC reserves the right to access and review content uploaded to the platform to ensure compliance with our
            Terms of Service, detect misuse, and protect users from harmful or illegal material. Such review may include
            examination of file metadata, communication content, and account activity logs. All such monitoring is
            conducted solely for legitimate business, legal, and security purposes.
          </Typography>
        </Box>

        {/* Section 9 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            9. International Data Transfers
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            EZC operates in and stores data across Canada and the United States. By using our services, you consent to
            the transfer of your information to these jurisdictions, which may have privacy laws that differ from those in your
            country of residence.
          </Typography>
        </Box>

        {/* Section 10 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            10. Security Measures
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            EZC implements appropriate administrative, technical, and physical safeguards to protect information from
            unauthorized access, disclosure, alteration, or destruction. These include encryption, limited employee access,
            and regular security reviews. Despite these measures, no system is completely secure, and users share data at
            their own risk.
          </Typography>
        </Box>

        {/* Section 11 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            11. User Rights
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            Under applicable law, you may have rights to access, correct, delete, or restrict processing of your personal
            information. Requests should be sent to <Box component="span" sx={{ color: 'primary.main', fontWeight: 500 }}>ezcustomers.info@gmail.com</Box>. EZC will respond in accordance with
            PIPEDA, CCPA, and GDPR requirements.
          </Typography>
        </Box>

        {/* Section 12 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            12. Children's Privacy
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            EZC does not knowingly collect information from individuals under 18 years of age. If a minor's data is
            discovered, it will be promptly deleted upon notification.
          </Typography>
        </Box>

        {/* Section 13 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            13. Changes to This Policy
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            EZC may revise this Privacy Policy at any time. The Effective Date at the top of this document will reflect the
            most recent update. Material changes will be communicated via email or in-app notice at least 30 days prior to
            enforcement.
          </Typography>
        </Box>

        {/* Section 14 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            14. Contact Information
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary',
              mb: 2
            }}
          >
            For privacy-related inquiries, requests, or complaints, contact us at:
          </Typography>
          <Box sx={{ 
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 3,
            mb: 2
          }}>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              EZ Customers
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Email: <Box component="span" sx={{ color: 'primary.main', fontWeight: 500 }}>ezcustomers.info@gmail.com</Box>
            </Typography>
            <Typography variant="body1">
              Subject: Privacy Officer
            </Typography>
          </Box>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            We will address all legitimate concerns in accordance with applicable laws.
          </Typography>
        </Box>
      </Box>
    </LayoutWeb>
  );
}

