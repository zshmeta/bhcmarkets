import React from 'react';
import {
    Container,
    ScrollContent,
    UserCard,
    AvatarPlaceholder,
    VipBadge,
    UserInfo,
    UserName,
    VerifyBadge,
    Section,
    SectionTitle,
    ListGroup,
    ListItem,
    ItemLeft,
    ItemRight,
    LogoutBtn
} from '../AccountPage.mobile.styles';
import { Header } from '../../components/Header';
import { H3, Caption } from '../../components/Typography';


export const MobileAccountPage = () => {
    const MenuItem = ({ label, value }: { label: string, value?: string }) => (
        <ListItem>
            <ItemLeft>{label}</ItemLeft>
            <ItemRight>{value}</ItemRight>
        </ListItem>
    );

    return (
        <Container>
            <Header title="Account" />
            <ScrollContent>

                {/* Profile Card */}
                <Section>
                    <UserCard>
                        <AvatarPlaceholder>
                            <H3>ZM</H3>
                            <VipBadge>L2</VipBadge>
                        </AvatarPlaceholder>
                        <UserInfo>
                            <UserName>zshmeta</UserName>
                            <VerifyBadge>Verified User</VerifyBadge>
                        </UserInfo>
                    </UserCard>
                </Section>

                {/* Settings Groups */}
                <Section>
                    <SectionTitle>SECURITY</SectionTitle>
                    <ListGroup>
                        <MenuItem label="Two-Factor Auth" value="Enabled" />
                        <MenuItem label="Change Password" />
                        <MenuItem label="Device Management" />
                    </ListGroup>
                </Section>

                <Section>
                    <SectionTitle>PREFERENCES</SectionTitle>
                    <ListGroup>
                        <MenuItem label="Currency" value="USD" />
                        <MenuItem label="Language" value="English" />
                        <MenuItem label="Notifications" />
                    </ListGroup>
                </Section>

                <Section>
                    <LogoutBtn onClick={() => { }}>Log Out</LogoutBtn>
                    <Caption style={{ textAlign: 'center', marginTop: '1rem', opacity: 0.5 }}>
                        Version 1.0.0 (Build 45)
                    </Caption>
                </Section>

            </ScrollContent>
        </Container>
    );
};
