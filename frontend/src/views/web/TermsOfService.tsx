import { Box, Typography, Divider } from '@mui/material';
import { LayoutWeb } from '../../layout/web/LayoutWeb';

export function TermsOfService() {
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
            EZ CUSTOMERS — TERMS OF SERVICE (TOS)
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              mb: 1,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            Effective Date: October 21, 2025 (Users' acceptance date is recorded automatically upon agreement.)
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
            1. Overview & Who We Are
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            EZ Customers ("EZC", "we", "us", "our") provides online tools that help service providers ("Creatives") and their
            customers ("Clients") manage bookings, generate agreements and invoices, exchange files, and process
            payments. EZ Customers is a software platform only. We do not provide creative services, do not hire or
            manage Creatives, and are not a party to any agreement between Clients and Creatives.
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
            2. Accounts & Eligibility
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            You must be at least 18 years old (or the age of majority in your jurisdiction). You are responsible for keeping
            your login credentials secure and for all actions taken under your account. We may refuse, suspend, or
            terminate accounts that violate these Terms or applicable laws.
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
            3. Relationship Between Client and Creative
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            The relationship between Clients and Creatives is independent and private. EZ Customers is not an employer,
            agency, broker, or guarantor, and does not provide legal, accounting, or tax advice.
          </Typography>
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
            4. Bookings, Consent, and Agreements
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
            All bookings occur through the EZ Customers booking system. When a Client checks the "I agree" box at
            checkout, it acts as a binding electronic signature for the relevant agreements. Each confirmed booking
            generates up to three documents:
          </Typography>
          <Box component="ol" sx={{ pl: 3, mb: 2 }}>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Invoice</Box> — outlining services, price, and milestone-based payments;
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Service Agreement</Box> — including platform Terms of Service and the Creative's public service details; and
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Optional Custom Agreement</Box> — uploaded by the Creative.
              </Typography>
            </Box>
          </Box>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            Creatives are bound to confirmed bookings. If a Creative refuses a booking, the Client receives a refund of any booking fee paid. Payment milestones are based on service stages, not calendar dates.
          </Typography>
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
            5. Payments & Fees
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
            All payments are processed through third-party processors (currently Stripe). Payouts to Creatives are made
            less platform and processing fees.
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary',
              mb: 2,
              fontWeight: 600
            }}
          >
            Platform Plans:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Basic (Free):</Box> 2.8% platform fee per transaction; 2 GB baseline storage; +1 GB for every $100
                earned in the previous month.
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8 }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Plus ($25/month):</Box> 1.6% platform fee per transaction; 100 GB baseline storage;
                +5 GB for every $100 earned in the previous month.
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
            EZC may adjust features, storage, or pricing with 30 days' notice.
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary',
              mb: 2,
              fontWeight: 600
            }}
          >
            Refunds, Processing Fees, and Finality of Charges:
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            All platform and payment-processing fees are final and non-refundable in all circumstances. This applies to refunds processed through EZ Customers and to refunds or cancellations handled privately between Clients and Creatives. EZC retains its platform fee (2.8% for Basic, 1.6% for Plus) on all transactions, including canceled or reversed payments. Payment processors (e.g., Stripe) also retain their fees. Any refund made between a Client and Creative will exclude these fees. Neither EZC nor Stripe will return platform or processing fees for cancellations, chargebacks, or disputes. Fees are deducted automatically and not displayed to Clients at checkout. Creatives and administrators may view breakdowns in dashboards.
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
            6. File Hosting, Retention & Access
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            EZC hosts files only to enable service transactions between Clients and Creatives. Files are retained for 45
            days and then permanently deleted. EZC is not a backup provider. Locked/unlocked file access depends on
            payment status and milestones. Storage growth applies monthly according to plan rules.
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
            7. Intellectual Property
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            Intellectual property ownership and licensing are governed by the Service Agreement between Client and
            Creative. EZC does not claim ownership of any user content. Users grant EZC a limited license to host, display,
            and transmit content solely for platform operation.
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
            8. Prohibited Conduct
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            Users may not violate laws, upload malicious software, misrepresent services, or attempt to evade platform
            fees. Off-platform payments that violate these Terms are prohibited.
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
            9. Disputes Between Clients and Creatives
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            EZC is not a party to Client–Creative agreements and does not mediate disputes. Parties are responsible for
            their own resolutions. EZC may provide technical logs or consent records only if required by law. EZC makes
            no warranties about service outcomes.
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
            10. Disclaimers & Limitation of Liability
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            EZC provides the platform "as is" and "as available." We make no warranties, express or implied. EZC is not
            liable for indirect, incidental, or consequential damages. EZC's total liability to any user shall not exceed the
            total platform fees paid by that user in the 90 days preceding any claim.
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
            11. Privacy & Data
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            Personal data collection and use are described in EZC's Privacy Policy. Data may be processed and stored
            across jurisdictions as necessary to operate the platform.
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
            12. Modifications to Services or Terms
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            EZC may update features or Terms. Users will be notified via email or in-app notice, with 30 days' notice for
            pricing changes. Continued use constitutes acceptance.
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
            13. Suspension & Termination
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            EZC may suspend or terminate accounts for fraud, misuse, or policy violations. Termination does not cancel
            accrued obligations.
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
            14. Electronic Consent
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            Checking an 'I agree' box or completing a booking constitutes a legal electronic signature. EZC stores consent
            logs and agreement IDs for record-keeping.
          </Typography>
        </Box>

        {/* Section 15 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            15. Governing Law & Venue
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            These Terms are governed by the laws of Canada and the United States, depending on user location. Disputes
            are subject to the courts of the relevant province or state.
          </Typography>
        </Box>

        {/* Section 16 */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            16. Contact & Notices
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
            Support Email: <Box component="span" sx={{ color: 'primary.main', fontWeight: 500 }}>ezcustomers.info@gmail.com</Box>. Notices may be delivered via email or in-app messaging.
          </Typography>
        </Box>

        <Divider sx={{ my: 5 }} />

        {/* Appendix A */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 600
            }}
          >
            Appendix A — Plan Summary
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
            <Box component="span" sx={{ fontWeight: 600 }}>Basic (Free):</Box> 2.8% fee per transaction, 2 GB base storage, +1 GB per $100 earned in the previous month
            (45-day retention). <Box component="span" sx={{ fontWeight: 600 }}>Plus ($25/month):</Box> 1.6% fee per transaction, 100 GB base storage, +5 GB per $100 earned
            in the previous month (45-day retention). Storage increases are recalculated monthly based on prior earnings.
            Files are deleted after 45 days.
          </Typography>
        </Box>

        {/* Clarity Statement */}
        <Box sx={{ 
          mb: 5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 3
        }}>
          <Typography 
            variant="h3" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              fontWeight: 600
            }}
          >
            Clarity Statement
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.8,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            EZ Customers is not a party to any Client–Creative agreement. All deliverables, refunds, IP rights, and disputes
            are solely between Clients and Creatives. EZC provides software tools only and bears no liability for services
            rendered or conflicts between users.
          </Typography>
        </Box>
      </Box>
    </LayoutWeb>
  );
}

